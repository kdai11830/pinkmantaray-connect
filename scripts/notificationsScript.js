// JQuery scripts for notifications page

$(document).ready(function() {

	console.log("notifications script begins...");

	var socket = io();

	$(".acceptBtn").click(function() {
		var idxStr = $(this).attr('id');
		var idx = idxStr[idxStr.length - 1];
		var id = $('#invitationsTable #userId' + idx);
		$("#invitationsTable #"+idx).empty();
		$("#invitationsTable #"+idx).append('<td>Invitation accepted! You can now see their information at the <a href="/">homepage</a>.</td>');
		$("#ignoreBtn"+idx).remove();
		$(this).remove();

		// emit signal to establish 2 way connection in db
		socket.emit('acceptInvitation', {"id": id});
	});

	// if ignore clicked, will remove from list
	$(".ignoreBtn").click(function() {
		var idxStr = $(this).attr('id');
		var idx = idxStr[idxStr.length - 1];
		var id = $('#invitationsTable #userId' + idx);
		$("#invitationsTable #"+idx).empty();
		$("#invitationsTable #"+idx).append('<td>Invitation ignored.</td>');
		$("#acceptBtn"+idx).remove();
		$(this).remove();

		// emit signal to remove from connections in db
		socket.emit('ignoreInvitation', {"id", id});
	});

	$(".cancelBtn").click(function() {
		var idxStr = $(this).attr('id');
		var idx = idxStr[idxStr.length - 1];
		var id = $('#pendingTable #userId' + idx);
		$("#pendingTable #"+idx).empty();
		$("#pendingTable #"+idx).append('<td>Invitation canceled.</td>');
		$(this).remove();

		// emit signal to remove from connections in db
		socket.emit('cancelPending', {"id", id});
	})

});