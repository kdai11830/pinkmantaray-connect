// jQuery scripts for connect page

$(document).ready(function() {

	// console.log("connect script begins...");

	var socket = io();

	$("#connectForm").submit(function () {
		// set all the custom values
		$('.custom').each(function() {
			if ($(this).is(':checked')) {
				$(this).val($(this).siblings('.custom_text').val());
			}
		});

		// put all grouped info in arrays
		var gender = [];
		$('input[name="option_gender"]').each(function() {
			gender.push($(this).val());
		});
		var sexuality = [];
		$('input[name="option_sexuality"]').each(function() {
			sexuality.push($(this).val());
		});
		var race = [];
		$('input[name="option_race"]').each(function() {
			race.push($(this).val());
		});
		var religion = [];
		$('input[name="option_religion"]').each(function() {
			religion.push($(this).val());
		});
		var interests = [];
		$('input[name="option_interest"]').each(function() {
			interests.push($(this).val());
		})
		var language = [];
		$('input[name="option_language"]').each(function() {
			interests.push($(this).val());
		})

		var ageArray = [parseInt($('[name=option_age1]').val()), parseInt($('[name=option_age2]').val())];
		var age1 = Math.min.apply(null,ageArray);
		var age2 = Math.max.apply(null,ageArray);

		// get the information from form and add to dict to pass to socket
		var emitVals = {
			"location": $('[name=option_location]').val(),
			"ageRange": [age1, age2],
			"gender": gender,
			"sexuality": sexuality,
			"race": race,
			"religion": religion,
			"interests": interests,
			"language": language
		}

		// emit values to application.js with socket
		socket.emit('search', emitVals);
		$("#resultsDisplay").empty();
		$("#noResults").remove();
		return false;
	});


	// when receiving data back from backend display in table
	socket.on('searchResults', function(d) {
		var data = [];
		for (var key in d["data"]) {
			data.push(d["data"][key]);
		}

		if (data.length > 0 ) {
			/* data: 
				0: id
				1: name
				2: pronouns
				3: country
				4: year
				5: gender
				6: sexuality
				7: race_ethnicity
				8: religion
				9: interests
				10: language
			*/

			// create table headers
			var headers = `<tr><th></th>
				<th>Pronouns</th>
				<th>Country</th>
				<th>Age</th>
				<th>Gender</th>
				<th>Sexuality</th>
				<th>Culture</th>
				<th>Religion</th>
				<th>Interests</th>
				<th>Language</th></tr>`;
			$('#resultsDisplay').append(headers);

			for (var i = 0; i < data.length; i++) {
				var curRow = 'entry' + i;
				$("#resultsDisplay").append('<tr id="' + curRow + '"></tr>');

				var connectBtn = '<td><button class="connectBtn">Connect</button></td>;'
				$("#" + curRow).append(connectBtn);
				$("#" + curRow).append('<td>' + data[i][2] + '</td>'); // pronouns
				$("#" + curRow).append('<td>' + data[i][3] + '</td>'); // country
				$("#" + curRow).append('<td>' + (new Date().getFullYear() - parseInt(data[i][4])) + '</td>'); // age
				$("#" + curRow).append('<td>' + data[i][5].join(', ') + '</td>');
				$('#' + curRow).append('<td>' + data[i][6].join(', ') + '</td>');
				$('#' + curRow).append('<td>' + data[i][7].join(', ') + '</td>');
				$('#' + curRow).append('<td>' + data[i][8].join(', ') + '</td>');
				$('#' + curRow).append('<td>' + data[i][9].join(', ') + '</td>');
				$('#' + curRow).append('<td>' + data[i][10].join(', ') + '</td>');
				$("#" + curRow).append('<td id="userId">' + data[i][0] + '</td>'); // id (HIDE THIS)
				$('#' + curRow).find('#userId').hide();
			}
		} else {
			$('#resultsDiv').append('<h3 id="noResults">No results found!</h3>');
		}

		$('html,body').animate({
        scrollTop: $("#resultsDiv").offset().top},
		1000);
		$("#resultsDisplay").addClass("displayPadding")
		

	});

	// dialog css stuff, can be replaced in future css styles file
	$('#confirmationDialog').css('position', 'absolute');
	$("#confirmationDialog").css('z-index', 9999);
	$('#confirmationDialog').css('background-color', '#0d354e62');
	$('#confirmationDialog').css('border-style', 'outset');

	$("#confirmationDialog").dialog({
		autoOpen: false,
		modal: true,
		resizable: false,
		show: false,
		draggable: false,
		open: function(event, ui) {
        	$(".ui-dialog-titlebar-close", ui.dialog || ui).hide();
    	}
	});

	var clickedConnectBtn = ''; // row id

	$('#resultsDisplay').on('click', '.connectBtn', function() {
		// show custom popup since I'm too lazy to turn off and reset my chrome
		clickedConnectBtn = $(this).closest('tr').attr('id');
		$("#confirmationDialog").dialog('open');
	});


	$('#closeBtn').click(function() {
		$('#confirmationDialog').dialog('close');
	});

	$('#confirmBtn').click(function() {
		// send information to mysql
		// get user id from the table
		var id = parseInt($('#' + clickedConnectBtn).find('#userId').html());
		socket.emit('connectSend', {"id": id});	
		$('#' + clickedConnectBtn + ' .connectBtn').replaceWith("Pending!");
		$("#confirmationDialog").dialog('close');
	});

	$('.restrict_select').bind('keydown', function(e) {
		if (e.keyCode==13) {
			var value = $(this).val();
			if (value != '') {
				e.preventDefault();
				var exists = false;
				var self = $(this);
				$(this).siblings('.select_list').children().each(function() {
					if ($(this).val().toLowerCase() === value.toLowerCase()) {
						exists = true;
						self.val($(this).val());
					}
				});
				if (!exists) {
					e.stopImmediatePropagation();
					return;
				}
			}
		}
	});


	$('.list_input').bind('keydown', function(e) {
		// clear error message if start typing
		$(this).siblings('.duplicate_msg').remove();

		var datatype = $(this).attr('id');

		// only do something if user pressed enter when not selecting from datalist
		if (e.keyCode==13) {
			var value = $(this).val();
			if (value != '') {
				// prevent from submitting form
				e.preventDefault();

				// replace with capitalized version if exists
				var self = $(this);
				$(this).siblings('.select_list').children().each(function() {
					if ($(this).val().toLowerCase() === value.toLowerCase()) {
						value = $(this).val();
					}
				});

				// check to see if already entered interest
				var exists = false;
				for (let li of $(this).siblings('.variable_list').children('li')) {
					var liTxt = $(li).clone().children().remove().end().text();
					if (value === liTxt) {
						exists = true;
					}
				}

				// if new interest, add to list
				if (!exists) {
					var li = $("<li>" + value + '<span class="close"> ×</span></li>');
					$(this).siblings('.variable_list').append(li);
					$(this).val('');
					// insert interest as hidden input with list attribute
					$(this).siblings('.variable_list').after('<input type="hidden" id="option_'+datatype+'" name="option_'+datatype+'" value="'+value+'">');

				// otherwise, show message
				} else {
					$(this).after('<div class="duplicate_msg">Interest already added!</div>');
					$(this).siblings('.duplicate_msg').css("color", "red");
					$(this).val('');
				}
				
			}
		}
	});

	// allow for x "buttons" to close the parent element
	$(".variable_list").delegate(".close", "click", function() {
		// remove hidden input with corresponding value
		var liTxt = $(this).parent().clone().children().remove().end().text();
		liTxt = liTxt.substring(0, liTxt.length);
		var listID = $(this).parent().parent().siblings('input').attr('id');
		$('#option_'+listID+'[value="' + liTxt + '"]').remove();	
		// remove li item
		$(this).parent().remove();
	});

})