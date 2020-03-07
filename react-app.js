import { React, ReactDOM, Component } from 'https://unpkg.com/es-react/dev/index.js';

class ReactApp extends Component{
  render(){
    return(
      React.createElement("div", {
        className: "ReactApp"
      }, React.createElement("h1", null, " Hello, World! "))
    );
  }
}

export default ReactApp;
