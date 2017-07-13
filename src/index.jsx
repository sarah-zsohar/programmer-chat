import React from 'react';
import ReactDOM from 'react-dom';
import Parent from './Parent.jsx';
import {
    HashRouter as Router,
    Route,
    Link
} from 'react-router-dom'

ReactDOM.render(

    <Router>
      <div>
      
        <Route path='/' component={Parent} />

      </div>
    </Router>,
    document.getElementById('root')
);
