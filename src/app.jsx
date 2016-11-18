import React from 'react';
import ReactDOM from 'react-dom';

import Chessboard from './Chessboard.jsx';

require('./styles.scss');

ReactDOM.render(
    <Chessboard />,
    document.getElementById('app')
);
