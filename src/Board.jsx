import React, {PropTypes} from 'react';

import Cell from './Cell.jsx';

import styles from './Chessboard.scss';

export default class Board extends React.Component {
    static propTypes = {
        grabbedFigure  : PropTypes.object,
        frozenFigure   : PropTypes.object,
        cellUnderDrag  : PropTypes.object,
        inlineStyles   : PropTypes.object,
        figures        : PropTypes.array,
        board          : PropTypes.array,
        availableMoves : PropTypes.array,
        playerColor    : PropTypes.string,
        onFigureGrab   : PropTypes.func,
        onFigureDrag   : PropTypes.func,
        onFigureDrop   : PropTypes.func,
        onFigureFrozen : PropTypes.func
    }

    componentWillUnmount() {
        delete this.parentNode;
    }

    handleParentNodeRendered = node => {
        this.parentNode = node;

        this.forceUpdate();
    };

    render() {
        const {
            board,
            inlineStyles,
            figures,
            grabbedFigure,
            frozenFigure,
            availableMoves,
            cellUnderDrag,
            playerColor,
            onFigureGrab,
            onFigureDrag,
            onFigureDrop,
            onFigureFrozen
        } = this.props;

        const cellColors = {
            ordinary: {
                white : 'rgb(240, 217, 181)',
                black : 'rgb(181, 136, 99)'
            },
            active: {
                white : 'rgb(140, 207, 231)',
                black : 'rgb(81, 126, 149)'
            }
        };

        return (
            <table className={styles.grid} ref={this.handleParentNodeRendered}>
                <tbody>
                    {
                        board.map((row, rowIndex) =>
                            <tr
                                key={rowIndex}
                            >
                                {
                                    row.map((cell, cellIndex) => {
                                        const canMoveToThisCell = availableMoves && availableMoves.find(move =>
                                            move.row === rowIndex && move.cell === cellIndex
                                        );
                                        const cellColorType = canMoveToThisCell ? 'active' : 'ordinary';
                                        const cellBackgroundColor = (rowIndex + cellIndex) % 2
                                            ? cellColors[cellColorType].black
                                            : cellColors[cellColorType].white;
                                        const isGrabbed = (
                                            grabbedFigure && grabbedFigure.row === rowIndex && grabbedFigure.cell === cellIndex
                                        );
                                        const figureColor = cell > 0 ? 'white' : 'black';
                                        const isFrozen = figureColor !== playerColor || (
                                            frozenFigure && frozenFigure.row === rowIndex && frozenFigure.cell === cellIndex
                                        );

                                        return (
                                            <td
                                                className={styles.cell}
                                                style={{
                                                    backgroundColor: cellBackgroundColor,
                                                    boxShadow: cellUnderDrag
                                                        && cellUnderDrag.row === rowIndex
                                                        && cellUnderDrag.cell === cellIndex
                                                            ? 'inset 0px 0px 0px 2px rgb(250, 20, 100)'
                                                            : null
                                                }}
                                                key={`${rowIndex}${cellIndex}`}
                                            >
                                                <Cell
                                                    parentNode     = {this.parentNode}
                                                    inlineStyles   = {inlineStyles}
                                                    figures        = {figures}
                                                    cell           = {cell}
                                                    color          = {figureColor}
                                                    rowIndex       = {rowIndex}
                                                    cellIndex      = {cellIndex}
                                                    isGrabbed      = {isGrabbed}
                                                    isFrozen       = {isFrozen}
                                                    onFigureGrab   = {onFigureGrab}
                                                    onFigureDrag   = {onFigureDrag}
                                                    onFigureDrop   = {onFigureDrop}
                                                    onFigureFrozen = {onFigureFrozen}
                                                />
                                            </td>
                                        );
                                    })
                                }
                            </tr>
                        )
                    }
                </tbody>
            </table>
        );
    }
}
