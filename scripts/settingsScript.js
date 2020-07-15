// JQuery script for settings page
$(document).ready(function() {

	console.log("settings script begins...");

	var socket = io();

	// dialog css stuff, can be replaced in future css styles file
	$('.dialog').css('position', 'absolute');
	$(".dialog").css('z-index', 9999);
	$('.dialog').css('background-color', 'white');
	$('.dialog').css('border-style', 'outset');

	$(".dialog").dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		show: false,
		draggable: false,
		open: function(event, ui) {
        	$(".ui-dialog-titlebar-close", ui.dialog || ui).hide();
    	}
	});

	var currentDialog;

	$('#changeUsername').click(function() {
		$('#changeUsernameDiv').dialog('open');
		currentDialog = $('#changeUsernameDiv');
	});

	$('#changePassword').click(function() {
		$('#changePasswordDiv').dialog('open');
		currentDialog = $('#changePasswordDiv');
	});

	$('#changeEmail').click(function() {
		$('#changeEmailDiv').dialog('open');
		currentDialog = $('#changeEmailDiv');
	});	

	$('#changeInstagram').click(function() {
		$('#changeInstagramDiv').dialog('open');
		$('#invalidInstagram').remove();
		currentDialog = $('#changeInstagramDiv');
	});

	$('#usernameSubmit').click(function(e) {
		e.preventDefault();
		var emitVals = {
			"verifyPass": $("#usernameVerifyPass").val(),
			"username": $("[name='username']").val()
		}
		socket.emit('updateInfo', emitVals);
		return false;
	});

	$('#passwordSubmit').click(function(e) {
		e.preventDefault();
		if ($("[name='newPass']").val() === $("[name='confirmPass']").val())
		var emitVals = {
			"verifyPass": $("#passwordVerifyPass").val(),
			"password": $("[name='password']").val()
		}
		socket.emit('updateInfo', emitVals);
		return false;
	});

	// do we need email verification again?
	$('#emailSubmit').click(function(e) {
		e.preventDefault();
		var emitVals = {
			"verifyPass": $("#emailVerifyPass").val(),
			"email": $("[name='email']").val()
		}
		socket.emit('updateInfo', emitVals);
		return false;
	});

	$('#instagramSubmit').click(function(e) {
		e.preventDefault();
		$('#invalidInstagram').remove();
		var req = new XMLHttpRequest();
		req.open('GET', 'http://www.instagram.com/' + $("[name='instagram']").val() + '/', false);
		req.send(null);
		if (req.status != 404) {
			var emitVals = {
				"verifyPass": $("#instagramVerifyPass").val(),
				"instagram": $("[name='instagram']").val()
			}
			socket.emit('updateInfo', emitVals);
		} else {
			$('[name="newInstagram"]').after('<p id="invalidInstagram">Invalid Instagram handle!</p>').css('color', 'red');
		}
	});

	$('.cancelBtn').click(function() {
		$('#duplicateMsg').remove();
		$(this).closest('.dialog').dialog('close');
	});

	$('.submitBtn').click(function() {
		$('#duplicateMsg').remove();
	})

	$('.changeBtn').click(function() {
		$('#successMsg').empty();
	});

	socket.on('updateInfoResult', function(d) {
		if (d['success'] === 'true') {
			// $('#successMsg').append('<h3>User information successfully updated!</h3>');
			currentDialog.dialog('close');
			// var value = currentDialog.find('.changeVal').attr('name');
			location.reload(true);
		} else if (d['success'] === 'false') {
			$('#successMsg').append('<h3>Something went wrong! User information not failed to update.</h3>');
			currentDialog.dialog('close');
		} else { // duplicate entry
			var value = currentDialog.find('.changeVal').attr('name');
			currentDialog.prepend('<p id="duplicateMsg">This '+ value +' is already in use!</p>');
		}
	});

});