import React, {PropTypes} from 'react';

import Draggable from 'react_simple_drag_and_drop';

import styles from './Chessboard.scss';

const Cell = (props) => {
    const {
        parentNode,
        figures,
        inlineStyles,
        color,
        cell,
        rowIndex,
        cellIndex,
        isFrozen,
        isGrabbed,
        onFigureGrab,
        onFigureDrag,
        onFigureDrop,
        onFigureFrozen
    } = props;

    return (
        cell !== 0
        ?
            <Draggable
                parentNode = {parentNode}
                frozen = {isFrozen}
                className={styles[
                    Math.abs(cell) === cell
                        ? `white_${figures[cell]}`
                        : `black_${figures[Math.abs(cell)]}`
                ]}
                styles={{
                    left: cellIndex * inlineStyles.cellSize,
                    top: rowIndex * inlineStyles.cellSize,
                    zIndex: isGrabbed ? 2 : 1,
                    cursor: isGrabbed ? 'move' : 'pointer'
                }}
                onGrab = {onFigureGrab.bind(null, {
                    color,
                    row  : rowIndex,
                    cell : cellIndex
                })}
                onDrag = {onFigureDrag.bind(null, {
                    row  : rowIndex,
                    cell : cellIndex
                })}
                onDrop = {onFigureDrop.bind(null, {
                    color,
                    row   : rowIndex,
                    cell  : cellIndex
                })}
                onDraggableFrozen = {onFigureFrozen}
            />
        :
            null
    );
};

Cell.propTypes = {
    parentNode     : PropTypes.object,
    inlineStyles   : PropTypes.object,
    figures        : PropTypes.array,
    color          : PropTypes.string,
    cell           : PropTypes.number,
    rowIndex       : PropTypes.number,
    cellIndex      : PropTypes.number,
    isFrozen       : PropTypes.bool,
    isGrabbed      : PropTypes.bool,
    onFigureGrab   : PropTypes.func,
    onFigureDrag   : PropTypes.func,
    onFigureDrop   : PropTypes.func,
    onFigureFrozen : PropTypes.func
};

export default Cell;
