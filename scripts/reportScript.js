// JQuery script for profile pages

$(document).ready(function() {

	var socket = io();

	$('#reportForm').submit(function() {
		var userId = $('#userId').val();
		socket.emit('report', {'id': id});
	});

	socket.on('reportResult', function(data) {
		// clear form
		$('#reportDiv').empty();

		// user successfully reported
		if (data.success) {
			var elements = `<h2>REPORTED</h2>
			<img border="0" alt="Successfully reported." 
						src="/views/imgs/check.png" width="60" height="60">
			<p>Thank you for reporting. Your safety is very important to us. If you have any further concerns, please reach out to Schuyler directly at schuyler@pinkmantaray.com.</p>
			<button id='returnBtn'>Return to Home</button>`;

			$('#reportDiv').append(elements);

		// something went wrong
		} else {
			var elements = `<h2>SOMETHING WENT WRONG</h2>
			<p>We apologize for the inconvenience. Please try again later.</p>
			<button id='returnBtn'>Return to Home</button>`;

			$('#reportDiv').append(elements);
		}
	});

	$('#reportDiv').on('click', '#returnBtn', function() {
		window.location.href = '/';
		return false;
	})

});