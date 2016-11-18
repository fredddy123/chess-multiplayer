import React from 'react';
import utils from './utils';

import Board       from './Board.jsx';
import StatusBoard from './StatusBoard.jsx';

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
        const figureName = this.figures[Math.abs(this.state.board[data.row][data.cell])];

        const availableMoves = utils.getAvailableMoves({
            name  : figureName,
            color : data.color,
            row   : data.row,
            cell  : data.cell
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

    canMoveChangeCastling = (pieceName) => {
        return pieceName === 'king' || pieceName === 'rook';
    }

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

    render() {
        const {
            board,
            grabbedFigure,
            frozenFigure,
            availableMoves,
            cellUnderDrag,
            statusLogs,
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
                    <StatusBoard logs = {statusLogs} />
                </div>
                <button onClick={this.handleRotateBoard}>Rotate</button>
            </div>
        );
    }
}
