function getAvailableMovesForPAWN(piece, board) {
    if (piece.row <= 0) {
        return [];
    }

    const result = [];

    const canMoveOneStepForward = board[piece.row - 1][piece.cell] === 0;

    if (canMoveOneStepForward) {
        result.push({
            row: piece.row - 1,
            cell: piece.cell
        });

        const canMoveTwoStepsForward = piece.row === 6 && board[piece.row - 2][piece.cell] === 0;

        if (canMoveTwoStepsForward) {
            result.push({
                row: piece.row - 2,
                cell: piece.cell
            });
        }
    }

    const canBeatLeft = (
        board[piece.row - 1][piece.cell - 1] !== 0
        && isOpponentsFigure(board[piece.row][piece.cell], board[piece.row - 1][piece.cell - 1])
    );

    const canBeatRight = (
        board[piece.row - 1][piece.cell + 1] !== 0
        && isOpponentsFigure(board[piece.row][piece.cell], board[piece.row - 1][piece.cell + 1])
    );

    if (canBeatLeft) {
        result.push({
            row: piece.row - 1,
            cell: piece.cell - 1
        });
    }

    if (canBeatRight) {
        result.push({
            row: piece.row - 1,
            cell: piece.cell + 1
        });
    }

    return result;
}

function getAvailableMovesForKNIGHT(piece, board) {
    const result = [];

    const moves = [
        {row: -1, cell: -2},
        {row: -2, cell: -1},
        {row: -2, cell: 1},
        {row: -1, cell: 2},
        {row: 1, cell: 2},
        {row: 2, cell: 1},
        {row: 2, cell: -1},
        {row: 1, cell: -2}
    ];

    const insideBoard = move => piece.row + move.row >= 0 && piece.row + move.row < 8
        && piece.cell + move.cell >= 0 && piece.cell + move.cell < 8;

    moves.forEach(move => {
        if (!insideBoard(move)) {
            return;
        }

        const targetCellIsClear = board[piece.row + move.row][piece.cell + move.cell] === 0;
        const targetCellIsOccupiedByPieceOfOpponet = (
            isOpponentsFigure(board[piece.row][piece.cell], board[piece.row + move.row][piece.cell + move.cell])
        );

        if (targetCellIsClear || targetCellIsOccupiedByPieceOfOpponet) {
            result.push({
                row  : piece.row + move.row,
                cell : piece.cell + move.cell
            });
        }
    });

    return result;
}

function getAvailableMovesForBISHOP(piece, board, options) {
    return getAvailableMovesForLinearFigure(piece, board, [
        {row: -1, cell: -1},
        {row: -1, cell: 1},
        {row: 1, cell: 1},
        {row: 1, cell: -1}
    ], options);
}

function getAvailableMovesForROOK(piece, board, options) {
    return getAvailableMovesForLinearFigure(piece, board, [
        {row: 0, cell: -1},
        {row: -1, cell: 0},
        {row: 0, cell: 1},
        {row: 1, cell: 0}
    ], options);
}

function getAvailableMovesForQUEEN(piece, board, options) {
    return getAvailableMovesForBISHOP(piece, board, options).concat(getAvailableMovesForROOK(piece, board, options));
}

function getAvailableMovesForKING(piece, board, {castling}) {
    return getAvailableMovesForQUEEN(piece, board, {singleStep: true}).concat(getAvailableCastlingMoves(piece, board, {castling}));
}

function getAvailableCastlingMoves(piece, board, {castling}) {
    if (!castling[piece.color] || castling[piece.color].temporaryDisallowed) {
        return [];
    }

    const result = [];

    const availableLinearMoves = getAvailableMovesForROOK(piece, board, {});
    const targetRightCell = availableLinearMoves.find(move => move.cell === 6);
    const targetLeftCell = availableLinearMoves.find(move => move.cell === 1);

    if (castling[piece.color].allowedWithRightRook && targetRightCell) {
        result.push({
            row: targetRightCell.row,
            cell: piece.color === 'white' ? 6 : 5
        });
    }

    if (castling[piece.color].allowedWithLeftRook && targetLeftCell) {
        result.push({
            row: targetLeftCell.row,
            cell: piece.color === 'white' ? 2 : 1
        });
    }

    return result;
}

function getAvailableMovesForLinearFigure(piece, board, moveSteps, {singleStep}) {
    const result = [];

    const insideBoard = (workingPosition, step) => workingPosition.row + step.row >= 0 && workingPosition.row + step.row < 8
        && workingPosition.cell + step.cell >= 0 && workingPosition.cell + step.cell < 8;

    moveSteps.forEach(step => {
        const workingPosition = {
            row  : piece.row,
            cell : piece.cell
        };

        let barrierWasFound = false;

        const stepsAmount = singleStep ? 1 : 8;


        for (let i = 0; i < stepsAmount; i++) {
            if (insideBoard(workingPosition, step)) {
                if (board[workingPosition.row + step.row][workingPosition.cell + step.cell] === 0) {
                    result.push({
                        row  : workingPosition.row + step.row,
                        cell : workingPosition.cell + step.cell
                    });
                } else if (isOpponentsFigure(
                    board[piece.row][piece.cell],
                    board[workingPosition.row + step.row][workingPosition.cell + step.cell]
                )) {
                    result.push({
                        row  : workingPosition.row + step.row,
                        cell : workingPosition.cell + step.cell
                    });

                    barrierWasFound = true;
                } else {
                    barrierWasFound = true;
                }

                if (barrierWasFound) {
                    break;
                }
            }

            workingPosition.row += step.row;
            workingPosition.cell += step.cell;
        }
    });

    return result;
}

function isOpponentsFigure(figureValue, opponentFigureValue) {
    return figureValue * opponentFigureValue < 0;
}

const handlers = {
    getAvailableMovesForPAWN,
    getAvailableMovesForKNIGHT,
    getAvailableMovesForBISHOP,
    getAvailableMovesForROOK,
    getAvailableMovesForQUEEN,
    getAvailableMovesForKING
};

function getAvailableMovesWithoutCheckDetecting(piece, board, castling) {
    return handlers[`getAvailableMovesFor${piece.name.toUpperCase()}`](piece, board, {castling});
}

function getAvailableMoves(piece, board, castling) {
    const candidatesForAvailableMoves = getAvailableMovesWithoutCheckDetecting(piece, board, castling);

    return candidatesForAvailableMoves.filter(move => {
        const tempBoard = board.slice().map(row => row.slice());

        makeMove(tempBoard, piece, move);

        const isUnderCheck = getNewUnderCheckStatus({
            color: piece.color,
            board: tempBoard,
            castling: {}
        });

        return !isUnderCheck;
    });
}

function makeMove(board, piece, targetCell) {
    board[targetCell.row][targetCell.cell] = board[piece.row][piece.cell];
    board[piece.row][piece.cell] = 0;
}

function getNewCastlingState(pieceMoved, castlingState) {
    if (!castlingState[pieceMoved.color]) {
        return castlingState;
    }

    const newCastlingState = {
        white: {
            ...castlingState.white
        },
        black: {
            ...castlingState.black
        }
    };

    if (pieceMoved.name.toUpperCase() === 'KING') {
        newCastlingState[pieceMoved.color] = null;

        return newCastlingState;
    }

    if (pieceMoved.name.toUpperCase() === 'ROOK') {
        if (pieceMoved.cell === 0) {
            if (!castlingState[pieceMoved.color].allowedWithRightRook) {
                newCastlingState[pieceMoved.color] = null;

                return newCastlingState;
            }

            newCastlingState[pieceMoved.color].allowedWithLeftRook = false;
        }

        if (pieceMoved.cell === 7) {
            if (!castlingState[pieceMoved.color].allowedWithLeftRook) {
                newCastlingState[pieceMoved.color] = null;

                return newCastlingState;
            }

            newCastlingState[pieceMoved.color].allowedWithRightRook = false;
        }
    }

    return newCastlingState;
}

function getNewUnderCheckStatus({color, board, castling}) {
    const isKingUnderRookAttack = isPieceUnderRookAttack({
        pieceNumber: 6,
        color,
        board,
        shouldCheckQueen: true
    });

    const isKingUnderBishopAttack = isPieceUnderBishopAttack({
        pieceNumber: 6,
        color,
        board,
        shouldCheckQueen: true
    });

    const isKingUnderKnightAttack = isPieceUnderKnightAttack({
        pieceNumber: 6,
        color,
        board
    });

    const isKingUnderOtherKingAttack = isPieceUnderKingAttack({
        pieceNumber: 6,
        color,
        board,
        castling
    });

    const isKingUnderPawnAttack = isPieceUnderPawnAttack({
        pieceNumber: 6,
        color,
        board,
        shouldRotate: true
    });

    return !!(
        isKingUnderRookAttack
        ||
        isKingUnderBishopAttack
        ||
        isKingUnderKnightAttack
        ||
        isKingUnderPawnAttack
        ||
        isKingUnderOtherKingAttack
    );
}

function isPieceUnderRookAttack({pieceNumber, color, board, shouldCheckQueen}) {
    const pieceColorNumber = color === 'white' ? 1 : -1;
    const colorInverter = -1;
    const pieceCoords = getCoords(pieceNumber * pieceColorNumber, board);
    const rookNumber = 4;
    const queenNumber = 5;

    const availableMoves = getAvailableMovesWithoutCheckDetecting({
        name: 'rook',
        color,
        row: pieceCoords.row,
        cell: pieceCoords.cell
    }, board, null);

    return !!availableMoves.find(move =>
        board[move.row][move.cell] === pieceColorNumber * rookNumber * colorInverter
        ||
        shouldCheckQueen && board[move.row][move.cell] === pieceColorNumber * queenNumber * colorInverter
    );
}

function isPieceUnderBishopAttack({pieceNumber, color, board, shouldCheckQueen}) {
    const pieceColorNumber = color === 'white' ? 1 : -1;
    const colorInverter = -1;
    const pieceCoords = getCoords(pieceNumber * pieceColorNumber, board);
    const bishopNumber = 3;
    const queenNumber = 5;

    const availableMoves = getAvailableMovesWithoutCheckDetecting({
        name: 'bishop',
        color,
        row: pieceCoords.row,
        cell: pieceCoords.cell
    }, board, null);

    return !!availableMoves.find(move =>
        board[move.row][move.cell] === pieceColorNumber * bishopNumber * colorInverter
        ||
        shouldCheckQueen && board[move.row][move.cell] === pieceColorNumber * queenNumber * colorInverter
    );
}

function isPieceUnderKnightAttack({pieceNumber, color, board}) {
    const pieceColorNumber = color === 'white' ? 1 : -1;
    const colorInverter = -1;
    const pieceCoords = getCoords(pieceNumber * pieceColorNumber, board);
    const knightNumber = 2;

    const availableMoves = getAvailableMovesWithoutCheckDetecting({
        name: 'knight',
        color,
        row: pieceCoords.row,
        cell: pieceCoords.cell
    }, board, null);

    return !!availableMoves.find(move => board[move.row][move.cell] === pieceColorNumber * knightNumber * colorInverter);
}

function isPieceUnderKingAttack({pieceNumber, color, board, castling}) {
    const pieceColorNumber = color === 'white' ? 1 : -1;
    const colorInverter = -1;
    const pieceCoords = getCoords(pieceNumber * pieceColorNumber, board);
    const kingNumber = 6;

    const availableMoves = getAvailableMovesWithoutCheckDetecting({
        name: 'king',
        color,
        row: pieceCoords.row,
        cell: pieceCoords.cell
    }, board, castling, null);

    return !!availableMoves.find(move => board[move.row][move.cell] === pieceColorNumber * kingNumber * colorInverter);
}

function isPieceUnderPawnAttack({pieceNumber, color, board, shouldRotate}) {
    const pieceColorNumber = color === 'white' ? 1 : -1;
    const colorInverter = -1;
    const workingBoard = shouldRotate ? board.slice().reverse().map(row => row.slice().reverse()) : board;
    const pieceCoords = getCoords(pieceNumber * pieceColorNumber, workingBoard);
    const pawnNumber = 1;

    const availableMoves = getAvailableMovesWithoutCheckDetecting({
        name: 'pawn',
        color,
        row: pieceCoords.row,
        cell: pieceCoords.cell
    }, workingBoard, null);

    return !!availableMoves.find(move => workingBoard[move.row][move.cell] === pieceColorNumber * pawnNumber * colorInverter);
}

function getCoords(pieceNumber, board) {
    let pieceCoords;

    for (let rowIndex = 0; rowIndex < board.length; rowIndex++) {
        const cellIndex = board[rowIndex].indexOf(pieceNumber);

        if (cellIndex === -1) {
            continue;
        }

        pieceCoords = {
            row: rowIndex,
            cell: cellIndex
        };

        break;
    }

    return pieceCoords;
}

module.exports = {
    getAvailableMoves,
    getNewCastlingState,
    getNewUnderCheckStatus,
    makeMove
};
