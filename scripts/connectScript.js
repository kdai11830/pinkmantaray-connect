// jQuery scripts for connect page

$(document).ready(function() {

	console.log("connect script begins...");

	var socket = io();

	$("#connectForm").submit(function () {
		// put all grouped info in arrays
		var gender = [];
		$('input[name=option_gender]').each(function() {
			gender.push($(this).val());
		});
		var sexuality = [];
		$('input[name=option_sexuality]').each(function() {
			sexuality.push($(this).val());
		});
		var race = [];
		$('input[name=option_race]').each(function() {
			race.push($(this).val());
		});
		var religion = [];
		$('input[name=option_religion]').each(function() {
			religion.push($(this).val());
		});
		var interests = [];
		$('input[name=option_interest').each(function() {
			interests.push($(this).val());
		})

		var ageArray = [parseInt($('[name=option_age1]').val()), parseInt($('[name=option_age2]').val())];
		console.log(ageArray);
		var age1 = Math.min.apply(null,ageArray);
		var age2 = Math.max.apply(null,ageArray);
		console.log([age1, age2]);

		// get the information from form and add to dict to pass to socket
		var emitVals = {
			"location": $('[name=option_location]').val(),
			"ageRange": [age1, age2],
			"gender": gender,
			"sexuality": sexuality,
			"race": race,
			"religion": religion,
			"interests": interests
		}

		// emit values to application.js with socket
		socket.emit('search', emitVals);
		$("#resultsDisplay").empty();
		return false;
	});


	// when receiving data back from backend display in table
	socket.on('searchResults', function(d) {
		var data = [];
		for (var key in d["data"]) {
			console.log(key);
			console.log(d["data"][key]);
			data.push(d["data"][key]);
		}
		console.log(data);

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
			*/

			// create table headers
			$('#resultsDisplay').append('<tr id="tableHeaders></tr>');
			var headers = `<th></th>
				<th>Pronouns</th>
				<th>Country</th>
				<th>Age</th>
				<th>Gender</th>
				<th>Sexuality</th>
				<th>Race/Ethnicity</th>
				<th>Religion</th>
				<th>Interests</th>`;
			$('#tableHeaders').append(headers);

			for (var i = 0; i < data.length; i++) {
				var curRow = 'entry' + i;
				$("#resultsDisplay").append('<tr id="' + curRow + '"></tr>');
				console.log(data[i]);

				var connectBtn = '<td><button class="connectBtn">Connect</button></td>;'
				$("#" + curRow).append(connectBtn);
				$("#" + curRow).append('<td>' + data[i][2] + '</td>') // pronouns
				$("#" + curRow).append('<td>' + data[i][3] + '</td>') // country
				$("#" + curRow).append('<td>' + (new Date().getFullYear() - parseInt(data[i][4])) + '</td>') // age
				$("#" + curRow).append('<td>' + data[i][5].join(', ') + '</td>');
				$('#' + curRow).append('<td>' + data[i][6].join(', ') + '</td>');
				$('#' + curRow).append('<td>' + data[i][7].join(', ') + '</td>');
				$('#' + curRow).append('<td>' + data[i][8].join(', ') + '</td>');
				$('#' + curRow).append('<td>' + data[i][9].join(', ') + '</td>');
			}
		} else {
			$('#resultsDiv').append('<h3 id="noResults">No results found!</h3>');
		}
	});


	$('.connectBtn').click(function() {
		var confirmMsg = `Are you sure you want to connect? When you select CONNECT, 
			a request with your (unidentifiable) information will be shared with 
			[this person] so that they can either accept or reject your request. 
			You can view your pending under NOTIFICATIONS tab.`
		if (confirm(confirmMsg)) {
			// replace button with text
			$(this).replaceWith('Invitation pending!');
		}
	});


	$('#interests').bind('keydown', function(e) {
		// clear error message if start typing
		$('#interests_message').remove();

		// only do something if user pressed enter when not selecting from datalist
		if (e.keyCode==13) {
			var interest = $(this).val();
			if (interest != '') {
				// prevent from submitting form
				e.preventDefault();

				// check to see if already entered interest
				var exists = false;
				for (let li of $("#interests_list li")) {
					var liTxt = $(li).clone().children().remove().end().text();
					if (interest + ' ' === liTxt) {
						exists = true;
					}
				}

				// if new interest, add to list
				if (!exists) {
					var li = $('<li>' + interest + ' <span class="close">[X]</span></li>');
					$("#interests_list").append(li);
					$(this).val('');
					// insert interest as hidden input with list attribute
					$("#interests_list").after('<input type="hidden" id="option_interest" name="option_interest[] value="' + interest + '">');

				// otherwise, show message
				} else {
					$(this).after('<div id="interests_message">Interest already added!</div>');
					$("#interests_message").css("color", "red");
					$(this).val('');
				}
				
			}
		}
	});

	// allow for x "buttons" to close the parent element
	$("#interests_list").delegate(".close", "click", function() {
		// remove hidden input with corresponding value
		var liTxt = $(this).parent().clone().children().remove().end().text();
		$('#entry_interest[value="' + liTxt + '"]').remove();
		// remove li item
		$(this).parent().remove();
	});

})