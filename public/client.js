// eslint-disable-next-line no-undef
$(document).ready(function () {
  // global io
  // eslint-disable-next-line no-undef
  var socket = io();

  socket.on("user count", function (data) {
    console.log(data);
  });

  // Form submittion with new message in field with id 'm'
  // eslint-disable-next-line no-undef
  $("form").submit(function () {
    // eslint-disable-next-line
    var messageToSend = $("#m").val();

    // eslint-disable-next-line no-undef
    $("#m").val("");
    return false; // prevent form submit from refreshing page
  });
});
