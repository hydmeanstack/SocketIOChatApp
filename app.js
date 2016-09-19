var express=require('express'),
    app=express(),

    /*
    Create a http server to host express application
    */

    server=require('http').createServer(app),
    
    /*
    
    This simply says that when the server is instantiated (note: not connected to) 
    we will open a listener for socket.io. This means that our server will ‘listen’ 
    for pages loaded by the server that have a WebSocket connection instantiated on them.
    
    */

    io=require('socket.io').listen(server);

  users={};
  var port = process.env.PORT || 4000;
    server.listen(port,function(){
      console.log(`Hurray !!!, you chat app is running at http://localhost:${port}`)
    });

app.use(express.static(__dirname + '/public'));
app.set('view engine','ejs');

app.get('/',function(req,res){
     res.render('index');
});


  io.sockets.on('connection',function(socket){

      console.log("A New Connection Established");

      socket.on('new user',function(data,callback){
        if(data in users){
          console.log("Username already taken");
          callback(false);
        }else{
          console.log("Username available");
          console.log(`User ${data} logged into chat`);
          callback(true);
          socket.nickname=data;
          users[socket.nickname]=socket;
          console.log("********** SOCKET FOR : "+ data  )
          console.log(socket._events);
          updateNicknames();
        }
      });
      

      function updateNicknames(){
        io.sockets.emit('usernames',Object.keys(users));
      }

      socket.on('usernames',function(data){
        console.log('event : usernames')
        console.log(data)
      })

      socket.on('send message',function(data,callback){
        var msg=data.trim();

        if(msg.substr(0,1) === '@'){
          msg=msg.substr(1);
          var ind=msg.indexOf(' ');
          if(ind !== -1){
            var name=msg.substring(0,ind);
            var msg=msg.substring(ind+1);
             if(name in users){
                users[name].emit('whisper',{msg:msg,nick:socket.nickname});
                socket.emit('private',{msg:msg,nick:name});
              console.log("Whispering !");
            }else{
              callback("Sorry, "+name+" is not online");
            }
          }else{
            callback("Looks like you forgot to write the message");
          }

        }

         else{
         console.log("Got Message :"+data)
         io.sockets.emit('new message',{msg:msg,nick:socket.nickname});
           }
      });


      socket.on('disconnect',function(data){
            console.log('event : disconnect')
            console.log(`User ${socket.nickname} disconnected`);
            if(!socket.nickname) return;
            delete users[socket.nickname];
            updateNicknames();
      });


});
