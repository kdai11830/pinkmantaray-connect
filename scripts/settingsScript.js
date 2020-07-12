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
			"verifyPass": $("[name='verifyPass']").val(),
			"username": $("[name='newUsername']").val()
		}
		socket.emit('updateInfo', emitVals);
	});

	$('#passwordSubmit').click(function() {
		if ($("[name='newPass']").val() === $("[name='confirmPass']").val())
		var emitVals = {
			"verifyPass": $("[name='verifyPass']").val(),
			"password": $("[name='newPass']").val()
		}
		socket.emit('updateInfo', emitVals);
	});


});