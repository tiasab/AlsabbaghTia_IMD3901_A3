var socket = io();
var user;
var id;
var users = [];
var socket;
var username;
var clients = [];
var nmr = 0;
var dev = true;
var unread = 0;
var focus = true;
var connected = false;
var regex = /(&zwj;|&nbsp;)/g;
var settings = {
    'name': null,
    'greentext': true,
    'inline': true,
    'sound': true,
    'desktop': false,
    'synthesis': false,
    'recognition': false
};
var d;
socket.on('update', (data) => {console.log();
    if (username != undefined)
    {
        console.log(data);
        if (data['user'] == username)
        {
            document.getElementById('divLogin').style.display = 'none';
            id = data['id'];
            document.getElementById(panelMessages).style.display = 'block';

            document.getElementById('send').childNodes[0].nodeValue = 'Send';
            updateBar('mdi-content-send', 'Type here', false);
        }
        canvasDisplay = 'block';
        changeSize();
    }
});
socket.on('userDisconected', (data) => {
    showChat(data.type, '', 'user disconnected.', '', '');
    var auxUsers = [];
    for (var i = 0; i < users.length; i++)
    {
        if (users[i][0] != data['user'])
        {
            auxUsers.push(users[i]);
        }
    }
    users = [...auxUsers];
    changeSize();
});
socket.on('chatMsg', (data) => {
    showChat(data.type, data.user, data['msg'], '', '');
});
socket.on('drawing', (data) => {
    if (data['user'] != username)
    {
        points = data['draw']['points'];
        var p = data['draw']['points'];
        for (var i = 0; i < p.length; i++)
        {
            ctx.beginPath();
            ctx.strokeStyle = p[i]['colour'];
            ctx.lineWidth = canvas.width * p[i]['lineWidth'];
            ctx.moveTo(canvas.width * p[i]['initial_pos'][0], canvas.height * p[i]['initial_pos'][1]);
            if (p[i]['others_pos'].length)
            {
                var sub_p = p[i]['others_pos'];
                for (var j = 0; j < sub_p.length; j++)
                {
                    ctx.lineTo(canvas.width * sub_p[j][0], canvas.height * sub_p[j][1]);
                }
                ctx.stroke();
            }
        }
    }
});
socket.on('error', (data) => {});

function updateBar(icon, placeholder, disable)
{
    document.getElementById('icon').className = 'mdi ' + icon;
    $('#' + messageInput).attr('placeholder', placeholder);
    $('#' + messageInput).prop('disabled', disable);
    $('#send').prop('disabled', disable);
}
function showChat(type, user, message, subtxt, mid, fontSize = null)
{
    var nameclass = '';
    if(type == 'global' || type == 'kick' || type == 'ban' || type == 'info' || type == 'light' || type == 'help' || type == 'role')
    {
        user = 'System';
    }
    if(type == 'me' || type == 'em')
    {
        type = 'emote';
    }
    if(!mid)
    {
        mid == 'system';
    }
    if(!subtxt)
    {
        if (fontSize == null)
        {
            $('#' + panel).append('<div data-mid="' + mid + '" class="' + type + '""><span class="name ' + nameclass + '"><b><a class="namelink" href="javascript:void(0)">' + user + '</a></b></span><span class="delete"><a href="javascript:void(0)">DELETE</a></span><br><span class="msg">' + message + '</span></div>');
        }
        else
        {
            $('#' + panel).append('<div data-mid="' + mid + '" class="' + type + '""><span class="name ' + nameclass + '"><b><a class="namelink" href="javascript:void(0)">' + user + '</a></b></span><span class="delete"><a href="javascript:void(0)">DELETE</a></span><br><span class="msg" style="font-size: ' + fontSize + 'pt; border: solid;">' + message + '</span></div>');
        }
    }
    else
    {
        $('#' + panel).append('<div data-mid="' + mid + '" class="' + type + '""><span class="name ' + nameclass + '"><b><a class="namelink" href="javascript:void(0)">' + user + '</a></b></span><br><span class="msg">' + message + '</span></div>');
    }
    $('#' + panel).animate({scrollTop: $('#' + panel).prop('scrollHeight')}, 500);
    //updateStyle();
    nmr++;
    if(settings.inline)
    {
        var m = message.match(/(https?|ftp):\/\/[^\s/$.?#].[^\s]*/gmi);

        if(m) {
            m.forEach(function(e, i, a) {
                // Gfycat Support
                if(e.indexOf('//gfycat') !== -1) {
                    var oldUrl = e;
                    e = e.replace('//gfycat.com', '//gfycat.com/cajax/get').replace('http://', 'https://');

                    $.getJSON(e, function(data) {
                        testImage(data.gfyItem.gifUrl.replace('http://', 'https://'), mid, oldUrl);
                    });
                } else {
                    testImage(e, mid, e);
                }
            });
        }
    }
}
function testImage(url, mid, oldUrl)
{
    var img = new Image();

    img.onload = function() {
        $('div[data-mid=' + mid + '] .msg a[href="' + oldUrl.replace('https://', 'http://') + '"]').html(img);
        $('#' + panel).animate({scrollTop: $('#' + panel).prop('scrollHeight')}, 500);
    };
    img.src = url;
}
function handleMsg()
{
    var value = $('#' + messageInput).val().replace(regex, ' ').trim();
    socket.emit('chatMsg', JSON.stringify({
        //type: 'guess',
        user: username, 
        msg: value
    }));
    $('#' + messageInput).val('');
}
function handleLogin(private = false)
{
    var value = $('#userInput').val().replace(regex, ' ').trim();
    if ((value.length > 0) && (!connected) && (username === undefined))
    {
        username = value;
        var data = JSON.stringify({'type' : 'update', 'user' : value});
        socket.emit('update', data);
    }
    $('#userInput').val('');
    $('#roomCode').val('');
}
function handleCanvas(points)
{
    socket.emit('drawing', JSON.stringify({
        user: username, 
        draw: {'points' : points}
    }));
}