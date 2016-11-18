import React, {PropTypes} from 'react';

import styles from './Chessboard.scss';

const StatusBoard = ({logs}) => (
    <div className={styles.statusBoard}>
        {
            logs.map((log, index) => (
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

StatusBoard.propTypes = {
    logs : PropTypes.array
};

export default StatusBoard;
