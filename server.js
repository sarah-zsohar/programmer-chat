const express = require('express');
const url = require('url');
const bodyParser = require('body-parser');
const app = express();
const http = require('http').Server(app);
const config = require('./config');
const request = require('request');
const path = require('path');
let API = require('groupme').Stateless;
let port = process.env.PORT || 9000;
let IncomingStream = require('groupme').IncomingStream;
console.log("connected on port "+port);


app.use(express.static(__dirname + '/public'));

app.get('/', function(request, response) {
    response.render('messages', {
    });
});

let io = require('socket.io').listen(app.listen(port));




io.on('connection', function(socket) {
    let accessToken='';
    let iStream='';
    socket.on('clientID', function (data) {
        accessToken=data.message
            let userID;

            // let clientID = '34675694';
    API.Users.me(accessToken, function(err, ret) {

        if (!err) {
            userID = ret.id;
            iStream = new IncomingStream(accessToken, userID);
            iStream.connect();
            loadGroups(socket, accessToken, userID);
            loadChats(socket, accessToken, userID)
            iStream.on('message', function(data) {
                console.log("new message");
                if (data.data && data.data.subject) {
                    let m = {};
                    m["name"] = data.data.subject.name;
                    m["text"] = data.data.subject.text;
                    if (data.data.subject.chat_id) {
                        id = data.data.subject.chat_id;
                    } else {
                        id = data.data.subject.group_id;
                    }
                    socket.emit('latestMessage', {
                        message: m,
                        id: id
                    });
                }
            })
        } else {
            console.log("ERROR!", err)
        }
    });
    setInterval(function() {
        // iStream.connect()
    }, 3540000)


    // iStream.on('connected', function() {
    //
    // })


    });
    socket.on('newComment', function(data) {
        let comment = data.message;
        let id = data.id;
        sendNewMessage(comment, id, socket, accessToken)
    });

});
function loadGroups(socket, accessToken) {
    API.Groups.index(accessToken, function(err, response) {
        if (!err) {
            let groups = [];
            let currentTime = Date.now() / 1000;
            for (let i = 0; i < response.length; i++) {
                if (currentTime - response[i].updated_at < 2678431) {
                    groups.push({
                        "name": response[i].name,
                        "id": response[i].id
                    });
                }
            }
            socket.emit('groups', {
                message: groups
            });
            loadMessages(groups, socket, accessToken)
        } else {
            console.log("ERROR!", err)
        }
    });
}

function loadChats(socket, accessToken, userID) {
    let options = {
        method: 'GET',
        url: 'https://api.groupme.com/v3/chats',
        headers: {
            'cache-control': 'no-cache',
            'x-access-token': accessToken,
            'content-type': 'application/json'
        },
        json: true
    };
    request(options, function(error, response, body) {
        let groups = [];
        let currentTime = Date.now() / 1000;
        let directmessages = body.response;

        for (let i = 0; i < directmessages.length; i++) {
            if (currentTime - directmessages[i].updated_at < 2678431) {
                groups.push({
                    "name": directmessages[i].other_user.name,
                    "id": directmessages[i].last_message.conversation_id
                });
            }
        }
        socket.emit('groups', {
            message: groups
        });
        loadDMs(groups, socket, accessToken, userID);
    });
}




function sendNewMessage(message, id, socket, accessToken, userID) {
    console.log("sending new");

    const connectTimestamp = Date.now()
    if (id.split('+').length > 1) {
        console.log("id", id);
        let  oid = id.split('+');
        if (oid[0] == userID) {
            otheruser = oid[1];
        } else {
            otheruser = oid[0];
        }
        var options = {
            method: 'POST',
            url: 'https://api.groupme.com/v3/direct_messages',
            headers: {

                'cache-control': 'no-cache',
                'x-access-token': accessToken,
                'content-type': 'application/json'
            },
            body: {
                message: {
                    recipient_id: otheruser,
                    source_guid: connectTimestamp,
                    text: message
                }
            },
            json: true
        };
    } else {
        var options = {
            method: 'POST',
            url: 'https://api.groupme.com/v3/groups/' + id + '/messages',
            headers: {

                'cache-control': 'no-cache',
                'x-access-token': accessToken,
                'content-type': 'application/json'
            },
            body: {
                message: {
                    source_guid: connectTimestamp,
                    text: message
                }
            },
            json: true
        };
    }
    request(options, function(error, response, body) {
        if (error) throw new Error("rr", error);
    });
    // }
}

function loadDMs(groups, socket, accessToken, userID) {
    console.log(userID);

    for (let v = 0; v < groups.length; v++) {
        let otheruser;
        let  id = groups[v]["id"];

        let  oid = groups[v]["id"].split('+');

        if (oid[0] == userID) {
            otheruser = oid[1];

        } else {
            otheruser = oid[0];
        }

        let options = {
            method: 'GET',
            url: 'https://api.groupme.com/v3/direct_messages',
            qs: {
                other_user_id: otheruser
            },
            headers: {
                'cache-control': 'no-cache',
                'x-access-token': accessToken,
                'content-type': 'application/json'
            },
            json: true
        };

        request(options, function(error, response, body) {
            if (error) throw new Error(error);

            let mes = body.response.direct_messages;
            let messages = [];

            mes.forEach(function (item, index) {

                let name = mes[index]["name"].replace(/[^\x00-\x7F]/g, "");
                let m = {};
                m["name"] = name;
                m["text"] = mes[index]["text"];
                messages.push(m)
            });
            socket.emit('initialMessages', {
                message: messages,
                conversation_id: id
            });
        });
    }
}

function loadMessages(groups, socket, accessToken) {
    for (let i = 0; i < groups.length; i++) {
        console.log(groups);
        let  id = groups[i]["id"];

        let options = {
            method: 'GET',
            url: 'https://api.groupme.com/v3/groups/' + groups[i]["id"] + '/messages',
            headers: {
                'cache-control': 'no-cache',
                'x-access-token': accessToken,
                'content-type': 'application/json'
            },

            json: true
        };
        request(options, function(error, response, body) {

            if (error) throw new Error(error);
            let mes = body.response.messages;

            let messages = [];

            mes.forEach(function (item, index) {

                let name = mes[index]["name"].replace(/[^\x00-\x7F]/g, "");
                let m = {};

                m["name"] = name;
                m["text"] = mes[index]["text"];
                messages.push(m)
            });
            socket.emit('initialMessages', {
                message: messages,
                conversation_id: id
            });
        });
    }
}
