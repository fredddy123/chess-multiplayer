import React from 'react';
import utils from './utils';

import Draggable from './SimpleDragAndDrop.jsx';

import Board from './Board.jsx';

import styles from './Chessboard.scss';

export default class Chessboard extends React.Component {
    constructor() {
        super();

        this.figures = ['empty', 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king'];

        this.inlineStyles = {
            cellSize: 65
        };

        this.boardMnemonicCoords = {
            x: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
            y: [8, 7, 6, 5, 4, 3, 2, 1]
        };

        this.state = {
            board: [
                [-4, -2, -3, -5, -6, -3, -2, -4],
                [-1, -1, -1, -1, -1, -1, -1, -1],
                [ 0,  0,  0,  0,  0,  0,  0,  0],
                [ 0,  0,  0,  0,  0,  0,  0,  0],
                [ 0,  0,  0,  0,  0,  0,  0,  0],
                [ 0,  0,  0,  0,  0,  0,  0,  0],
                [ 1,  1,  1,  1,  1,  1,  1,  1],
                [ 4,  2,  3,  5,  6,  3,  2,  4]
            ],
            availableMoves: null,
            grabbedFigure: null,
            frozenFigure: null,
            cellUnderDrag: null,
            castling: {
                white: {
                    temporaryDisallowed: false,
                    allowedWithLeftRook: true,
                    allowedWithRightRook: true
                },
                black: {
                    temporaryDisallowed: false,
                    allowedWithLeftRook: true,
                    allowedWithRightRook: true
                }
            },
            underCheck: {
                white: false,
                black: false
            },
            color: 'white',
            statusLogs: []
        };
    }

    componentWillUnmount() {
        delete this.figures;
        delete this.boardMnemonicCoords;
        delete this.inlineStyles;
    }

    handleFigureGrab = data => {
        const figureColor = this.getFigureColor(data.row, data.cell);
        const figureName = this.figures[Math.abs(this.state.board[data.row][data.cell])];

        const availableMoves = utils.getAvailableMoves({
            name: figureName,
            color: figureColor,
            row: data.row,
            cell: data.cell
        }, this.state.board, this.state.castling);

        this.setState({
            grabbedFigure: {
                row  : data.row,
                cell : data.cell
            },
            availableMoves
        });
    }

    handleFigureDrag = (data, position) => {
        const cellUnderDrag = this.getCellCoordsFromPoint(position);

        this.setState({
            cellUnderDrag
        });
    }

    handleFigureDrop = (data, position) => {
        const cellUnderDrag = this.getCellCoordsFromPoint(position);

        if (!this.state.availableMoves.find(move => move.row === cellUnderDrag.row && move.cell === cellUnderDrag.cell)) {
            this.setState({
                grabbedFigure: null,
                cellUnderDrag: null,
                frozenFigure: {
                    row: this.state.grabbedFigure.row,
                    cell: this.state.grabbedFigure.cell
                }
            });

            return;
        }

        const pieceName = this.figures[Math.abs(this.state.board[data.row][data.cell])];

        const newBoardState = this.state.board;

        if (Math.abs(this.state.board[this.state.grabbedFigure.row][this.state.grabbedFigure.cell]) === 6) {
            const stepsTakenToRightSide = cellUnderDrag.cell - this.state.grabbedFigure.cell;

            if (Math.abs(stepsTakenToRightSide) === 2) {
                if (stepsTakenToRightSide > 0) {
                    newBoardState[cellUnderDrag.row][cellUnderDrag.cell - 1] = newBoardState[this.state.grabbedFigure.row][7];
                    newBoardState[this.state.grabbedFigure.row][7] = 0;
                }

                if (stepsTakenToRightSide < 0) {
                    newBoardState[cellUnderDrag.row][cellUnderDrag.cell + 1] = newBoardState[this.state.grabbedFigure.row][0];
                    newBoardState[this.state.grabbedFigure.row][0] = 0;
                }
            }
        }

        newBoardState[cellUnderDrag.row][cellUnderDrag.cell] = newBoardState[this.state.grabbedFigure.row][this.state.grabbedFigure.cell];
        newBoardState[this.state.grabbedFigure.row][this.state.grabbedFigure.cell] = 0;

        const opponentColor = data.color === 'white' ? 'black' : 'white';

        const newUnderCheckState = utils.getNewUnderCheckStatus({
            color    : opponentColor,
            board    : newBoardState,
            castling : this.state.castling
        });

        let newCastlingState = this.state.castling;

        if ((this.state.castling.white || this.state.castling.black) && this.canMoveChangeCastling(pieceName)) {
            newCastlingState = utils.getNewCastlingState({
                name: pieceName,
                color: this.state.color,
                row: data.row,
                cell: data.cell,
                targetRow: cellUnderDrag.row,
                targetCell: cellUnderDrag.cell
            }, this.state.castling, this.state.color);
        }

        const newStatusLogs = [
            ...this.state.statusLogs
        ];

        if (newUnderCheckState) {
            newStatusLogs.push({
                text: `${opponentColor} is under check`,
                color: 'navy'
            });
        }

        this.setState({
            grabbedFigure: null,
            availableMoves: null,
            cellUnderDrag: null,
            board: newBoardState,
            castling: newCastlingState,
            underCheck: {
                ...this.state.underCheck,
                [opponentColor]: newUnderCheckState
            },
            statusLogs: newStatusLogs
        });
    }

    handleParentNodeRendered = node => {
        this.parentNode = node;

        this.forceUpdate();
    };

    handleFigureFrozen = () => {
        if (!this.state.frozenFigure) {
            return;
        }

        this.setState({
            frozenFigure: null
        });
    };

    handleRotateBoard = () => {
        this.setState({
            board: this.state.board.slice().reverse().map(row => row.slice().reverse()),
            color: this.state.color === 'white' ? 'black' : 'white',
            availableMoves: null
        });
    }

    getCellCoordsFromPoint = point => {
        const newRow = Math.floor(point.mouseTop / this.inlineStyles.cellSize);
        const newCell = Math.floor(point.mouseLeft / this.inlineStyles.cellSize);

        return {
            row: newRow < 8 ? newRow : -1,
            cell: newCell < 8 ? newCell : -1
        };
    }

    getFigureColor = (row, cell) => this.state.board[row][cell] > 0 ? 'white' : 'black';

    canMoveChangeCastling = (pieceName) => {
        return pieceName === 'king' || pieceName === 'rook';
    }

    // renderCell = (cell, rowIndex, cellIndex) => {
    //     const {
    //         frozenFigure,
    //         grabbedFigure,
    //         color
    //     } = this.state;
    //
    //     const isFigureColorEqualsPlayingColor = (
    //         this.getFigureColor(rowIndex, cellIndex) === color
    //     );
    //
    //     const isFigureFrozen = (
    //         frozenFigure
    //             && frozenFigure.row === rowIndex
    //             && frozenFigure.cell === cellIndex
    //     );
    //
    //     const shouldFreeze = !isFigureColorEqualsPlayingColor || isFigureFrozen;
    //
    //     return (
    //         cell !== 0
    //         ?
    //             <Draggable
    //                 parentNode = {this.parentNode}
    //                 frozen = {shouldFreeze}
    //                 className={styles[
    //                     Math.abs(cell) === cell
    //                         ? `white_${this.figures[cell]}`
    //                         : `black_${this.figures[Math.abs(cell)]}`
    //                 ]}
    //                 styles={{
    //                     left: cellIndex * this.inlineStyles.cellSize,
    //                     top: rowIndex * this.inlineStyles.cellSize,
    //                     zIndex:
    //                         grabbedFigure
    //                         && grabbedFigure.row === rowIndex
    //                         && grabbedFigure.cell === cellIndex
    //                             ? 2
    //                             : 1,
    //                     cursor: grabbedFigure ? 'move' : 'pointer'
    //                 }}
    //                 onGrab = {this.handleFigureGrab.bind(this, {
    //                     row  : rowIndex,
    //                     cell : cellIndex
    //                 })}
    //                 onDrag = {this.handleFigureDrag.bind(this, {
    //                     row  : rowIndex,
    //                     cell : cellIndex
    //                 })}
    //                 onDrop = {this.handleFigureDrop.bind(this, {
    //                     color : cell > 0 ? 'white' : 'black',
    //                     row   : rowIndex,
    //                     cell  : cellIndex
    //                 })}
    //                 onDraggableFrozen = {this.handleFigureFrozen}
    //             />
    //         :
    //             null
    //     );
    // }

    // renderBoard = () => {
    //     const {
    //         board,
    //         availableMoves,
    //         cellUnderDrag
    //     } = this.state;
    //
    //     return (
    //         <table className={styles.grid} ref={this.handleParentNodeRendered}>
    //             <tbody>
    //                 {
    //                     board.map((row, rowIndex) =>
    //                         <tr
    //                             key={rowIndex}
    //                         >
    //                             {
    //                                 row.map((cell, cellIndex) => {
    //                                     let cellBackgroundColor;
    //
    //                                     const canMoveToThisCell = availableMoves && availableMoves.find(move =>
    //                                         move.row === rowIndex && move.cell === cellIndex
    //                                     );
    //
    //                                     if (canMoveToThisCell) {
    //                                         cellBackgroundColor = (rowIndex + cellIndex) % 2
    //                                         ? 'rgb(81, 126, 149)'
    //                                         : 'rgb(140, 207, 231)';
    //                                     } else {
    //                                         cellBackgroundColor = (rowIndex + cellIndex) % 2
    //                                             ? 'rgb(181, 136, 99)'
    //                                             : 'rgb(240, 217, 181)';
    //                                     }
    //
    //                                     return (
    //                                         <td
    //                                             className={styles.cell}
    //                                             style={{
    //                                                 backgroundColor: cellBackgroundColor,
    //                                                 boxShadow: cellUnderDrag
    //                                                     && cellUnderDrag.row === rowIndex
    //                                                     && cellUnderDrag.cell === cellIndex
    //                                                         ? 'inset 0px 0px 0px 2px rgb(250, 20, 100)'
    //                                                         : null
    //                                             }}
    //                                             key={`${rowIndex}${cellIndex}`}
    //                                         >
    //                                             {this.renderCell(cell, rowIndex, cellIndex)}
    //                                         </td>
    //                                     );
    //                                 })
    //                             }
    //                         </tr>
    //                     )
    //                 }
    //             </tbody>
    //         </table>
    //     );
    // }

    renderVerticalCoords = () => (
        <div className={styles.verticalCoords}>
            {
                this.state.board.map((row, rowIndex) =>
                    <div className={styles.verticalCoord} key={rowIndex}>
                        {8 - rowIndex}
                    </div>
                )
            }
        </div>
    );

    renderHorizontalCoords = () => (
        <div className={styles.horizontalCoords}>
            {
                this.state.board.map((row, rowIndex) =>
                    <div className={styles.horizontalCoord}key={rowIndex}>
                        {this.boardMnemonicCoords.x[rowIndex]}
                    </div>
                )
            }
        </div>
    );

    renderStatusBoard = () => (
        <div className={styles.statusBoard}>
            {
                this.state.statusLogs.map((log, index) => (
                    <div
                        key={index}
                        className={styles.statusLog}
                        style={{
                            color: log.color
                        }}
                    >
                        {log.text}
                    </div>
                ))
            }
        </div>
    );

    render() {
        const {
            board,
            grabbedFigure,
            frozenFigure,
            availableMoves,
            cellUnderDrag,
            color
        } = this.state;

        return (
            <div
                className={styles.Chessboard}
            >
                <div className={styles.rowBlock}>
                    {this.renderVerticalCoords()}
                    <div className={styles.rightBlock}>
                        <Board
                            board          = {board}
                            inlineStyles   = {this.inlineStyles}
                            figures        = {this.figures}
                            grabbedFigure  = {grabbedFigure}
                            frozenFigure   = {frozenFigure}
                            availableMoves = {availableMoves}
                            cellUnderDrag  = {cellUnderDrag}
                            playerColor    = {color}
                            onFigureGrab   = {this.handleFigureGrab}
                            onFigureDrag   = {this.handleFigureDrag}
                            onFigureDrop   = {this.handleFigureDrop}
                            onFigureFrozen = {this.handleFigureFrozen}
                        />
                        {this.renderHorizontalCoords()}
                    </div>
                    {this.renderStatusBoard()}
                </div>
                <button onClick={this.handleRotateBoard}>Rotate</button>
            </div>
        );
    }
}
