// eslint-disable-next-line no-undef
$(document).ready(function () {
  // global io
  var socket = io(); // eslint-disable-line

  socket.on("user", function (data) {
    $("num-users").text(data.currentUsers + " users online"); // eslint-disable-line
    let message =
      data.name +
      (data.connected ? " has joined the chat." : " has left the chat");
    $("messages").append($("<li>").html("<b>" + message + "</b>")); // eslint-disable-line
  });

  socket.on("chat message", (data) => {
    $("#messages").append($("<li>").text(`${data.name}: ${data.message}`)); // eslint-disable-line
  });

  // Form submittion with new message in field with id 'm'
  // eslint-disable-next-line no-undef
  $("form").submit(function () {
    var messageToSend = $("#m").val(); // eslint-disable-line
    socket.emit("chat message", messageToSend);

    $("#m").val(""); // eslint-disable-line
    return false; // prevent form submit from refreshing page
  });
});
