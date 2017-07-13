import React, {
    Component
} from 'react';

import {
    HashRouter as Router,
    Route,
    Link
} from 'react-router-dom';
import io from 'socket.io-client'
let socket = io.connect();


class Parent extends Component {
    constructor(props) {
        super(props);
        this.state = {

            conversationID: '',
            conversations: [],
            isAuth: '',
            clientID: ''

        };
        this.loadInitial = this.loadInitial.bind(this);
        this.loadNew = this.loadNew.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        socket.on('initialMessages', (data) => this.getMessages(data));
        socket.on('latestMessage', (data) => this.getNewMessage(data))
        socket.on('groups', (data) => this.getGroups(data))
    }

    componentWillMount(){
        console.log(window.location.href);
        var url=window.location.href.split('=');


    console.log(url[1]);

    if(typeof(url[1])=="undefined"){
        this.forceUpdate();
          window.location.assign('https://oauth.groupme.com/oauth/login_dialog?client_id=xEczAy2pXgjl7kFec7JxcfrbLH0fEdSrhCofUcagKonfrVw2')
     }else{

         url=url[1];
         url=url.split('#')
         var clientID=url[0];
         console.log(clientID);
         socket.emit('clientID', {
             message: clientID
         });
         this.setState({
             clientID: clientID
         });
     }
    }
    getGroups(data) {

        var groups = data.message;

        var copy = this.state.conversations.slice();
        var t = groups.map(message => {
            var type;

            if (message.id.split('+').length > 1) {
                type = " directMessage"
            } else {
                type = " groupChat"
            }
            return {
                name: message.name,
                conversation_id: message.id,
                messages: [],
                comment: '',
                chatType: type
            }
        });

        copy = copy.concat(t);
        this.setState({
            conversations: copy
        });
        // this.loadInitial(messages);
        //console.log(messages);
    }
    getMessages(data) {
        var messages = data.message;
        let conversation_id = data.conversation_id;
        this.loadInitial(messages, conversation_id);

    }
    getNewMessage(data) {
        console.log(data.message);
        var message = data.message;
        let id = data.id;
        this.loadNew(message, id);
    }
    loadNew(message, id) {

        var regex =
            /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|[\ud83c[\ude50\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;

        var name = message.name.replace(regex, '');
        this.state.conversations.map((conversation, index) => {
            if (conversation.conversation_id == id) {
                var copy = this.state.conversations.slice();
                var m = {
                    name: message.name,
                    text: message.text
                }

                copy[index]["messages"].push(m);

                this.setState({
                    conversations: copy
                })
            }
        })
    }
    loadInitial(messages, id) {
        this.state.conversations.map((conversation, index) => {
            if (conversation.conversation_id == id) {
                var copy = this.state.conversations.slice();
                var m = messages.reverse().map(message => {
                    var name = message.name.split(" ");
                    name[0] = name[0].toLowerCase();
                    var n = '';
                    for (var i = 0; i < name.length; i++) {
                        n = n.concat(name[i])
                    }

                    return {
                        name: n,
                        text: message.text
                    }
                });
                copy[index]["messages"] = m;

                this.setState({
                    conversations: copy
                })
            }
        })
    }
    handleSubmit(event) {
        event.preventDefault();
        let comment = '';
        this.state.conversations.map((conversation, index) => {
            if (conversation.conversation_id == event.target.id) {
                var copy = this.state.conversations.slice();
                comment = conversation.comment;
                copy[index]["comment"] = '';
                this.setState({
                    conversations: copy
                })

            }
        })
        socket.emit('newComment', {
            message: comment,
            id: event.target.id
        });

        this.ref.reset();

    }
    handleChange(event) {
        this.state.conversations.map((conversation, index) => {
            if (conversation.conversation_id == event.target.id) {
                var copy = this.state.conversations.slice();
                copy[index]["comment"] = event.target.value;
                this.setState({
                    conversations: copy
                })
            }
        })
    }
    render() {
        let fe = "function";
        let f = "{";
        let cb = "}"


        let conversation = this.state.conversations.map((conversation, index) => {
            let messages = conversation.messages.map((message, index) => {
                var messageStr = [];
                if (message.text) {
                    messageStr = message.text.replace(/.{50}\S*\s+/g, "$&@").split(/\s+@/);
                } else {
                    var placeholder = "Image was sent"
                    messageStr.push(placeholder)
                }


                let messagestring = messageStr.map((message) => {
                    return (
                        <div id="message"><span className="key-declaration">message</span><span className="punctuation">:</span><span className="message">{message}</span><br></br></div>
                    )
                });
                return (
                    <div>
                        <span className="var">var</span> <span className="varDeclaration">{message.name}</span><span className="punctuation">=</span><span className="function-arguments">{f}</span><br></br>
                        {messagestring}
                        <span className="closing-bracket">{cb}</span>
                    </div>
                )
            });
            return (

                <div key={index} className="messageBlock" >
                <div id="convoName"><span className="function">function </span><span className="function-name">{conversation.chatType}</span><span className="function-arguments">({conversation.name }){f} </span></div>
                {messages}
                <div>
                <span className="var">var</span> <span className="varDeclaration">newMessage</span><span className="punctuation">=</span><span className="function-arguments">{f}</span><br></br>

                    <form ref={ref=>this.ref=ref} id = {conversation.conversation_id} className="positionPopup" onSubmit={this.handleSubmit.bind(this)}  >
                        <span className = "key-declaration">new</span><span className="punctuation">:</span><input id={conversation.conversation_id} type="string" className ="textbox" value={conversation.comment} onChange={this.handleChange}/>
                        <input id ={conversation.conversation_id}  type="hidden"  value={conversation.conversation_id}  />
                    </form>

                <span className="closing-bracket">{cb}</span>
                <div></div>
                <span className="function-arguments">{cb}</span>
                </div>
                </div>
            )


        });
        return (
            <div>
                {conversation}

            </div>
        );
    }
}

export default Parent
