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

	$('#changeUsername').click(function() {
		$('#changeUsernameDiv').dialog('open');
	});

	$('#changePassword').click(function() {
		$('#changePasswordDiv').dialog('open');
	});

	$('#changeEmail').click(function() {
		$('#changeEmailDiv').dialog('open');
	});	

	$('#changeInstagram').click(function() {
		$('#changeInstagramDiv').dialog('open');
	});

	$('#usernameSubmit').click(function() {
		var emitVals = {
			"verifyPass": $("#usernameForm [name='verifyPass']").val(),
			"username": $("[name='newUsername']").val()
		}
		socket.emit('updateInfo', emitVals);
	});

	$('#passwordSubmit').click(function() {
		console.log($("#passwordSubmit [name='verifyPass']").val());
		if ($("[name='newPass']").val() === $("[name='confirmPass']").val())
		var emitVals = {
			"verifyPass": $("#passwordForm [name='verifyPass']").val(),
			"password": $("[name='newPass']").val()
		}
		socket.emit('updateInfo', emitVals);
	});

	// do we need email verification again?
	$('#emailSubmit').click(function() {
		var emitVals = {
			"verifyPass": $("#emailForm [name='verifyPass']").val(),
			"email": $("[name='newEmail']").val()
		}
		socket.emit('updateInfo', emitVals);
	});

	$('#instagramSubmit').click(function() {
		var req = new XMLHttpRequest();
		req.open('GET', 'http://www.instagram.com/' + $("[name='instagram']").val() + '/', false);
		req.send(null);
		if (req.status != 404) {
			var emitVals = {
				"verifyPass": $("#instagramForm [name='verifyPass']").val(),
				"instagram": $("[name='instagram']").val()
			}
			socket.emit('updateInfo', emitVals);
		} else {
			// TODO: add invalid instagram behavior here
		}
	});

	$('.cancelBtn').click(function() {
		$(this).closest('.dialog').dialog('close');
	});

	socket.on('updateInfoResult', function(d) {
		if (d['success']) {
			// TODO: display success message
		} else {
			// TODO: display failure message
		}
	})

});