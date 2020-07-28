// JQuery scripts for notifications page

$(document).ready(function() {

	console.log("notifications script begins...");

	var socket = io();

	$("#invitationsTable tr").on('click', '.acceptBtn', function() {
		console.log("accept button clicked");
		var idxStr = $(this).attr('id');
		var idx = idxStr[idxStr.length - 1];
		console.log(idx);
		var id = $('#invitationsTable #userId' + idx).html();
		$("#invitationsTable #"+idx).empty();
		// $("#invitationsTable #"+idx).append('<td class="successMsg">nice.</td>');
		$("#invitationsTable #"+idx).append('<td class="successMsg">Invitation accepted! You can now see their information at the <a href="/">homepage</a>.</td>');
		$("#invitationsTable #buttons"+idx).remove();

		// emit signal to establish 2 way connection in db
		socket.emit('acceptInvitation', {"id": id});
	});

	// if ignore clicked, will remove from list
	$("#invitationsTable tr").on('click', '.ignoreBtn', function() {
		console.log("ignore button clicked");
		var idxStr = $(this).attr('id');
		var idx = idxStr[idxStr.length - 1];
		var id = $('#invitationsTable #userId' + idx).html();
		$("#invitationsTable #"+idx).empty();
		$("#invitationsTable #"+idx).append('<td>Invitation ignored.</td>');
		$("#invitationsTable #buttons"+idx).remove();

		// emit signal to remove from connections in db
		socket.emit('ignoreInvitation', {"id": id});
	});

	$("#pendingTable tr").on('click', '.cancelBtn', function() {
		console.log("cancel button clicked");
		var idxStr = $(this).attr('id');
		var idx = idxStr[idxStr.length - 1];
		var id = $('#pendingTable #userId' + idx).html();
		$("#pendingTable #"+idx).empty();
		$("#pendingTable #"+idx).append('<td>Invitation canceled.</td>');
		$("#pendingTable #buttons"+idx).remove();

		// emit signal to remove from connections in db
		socket.emit('cancelPending', {"id": id});
	})

});