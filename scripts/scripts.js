	// file for jQuery functions

$(document).ready(function() {

	console.log("JS SCRIPT RUNNING");

	// dynamically add dates to select
	for (var i = new Date().getFullYear(); i > 1900; i--) {
		$("#select_year").append($("<option></option>").attr("value",i).text(i.toString()));
	}


	// controller for selecting state in USA
	$("#select_country").change(function() {
		if ($("#select_country").val() == "USA") {
			$("#state_div").show();
		} else {
			$('#select_state option')[0].selected = true;
			$("#state_div").hide();
		}
	});


	// verification of instagram username
	$("#instagram").blur(function() {
		var req = new XMLHttpRequest();
		req.open('GET', 'http://www.instagram.com/' + $("#instagram").val() + '/', false);
		req.send(null);
		if (req.status == 404) {
			$("#instagram_message").remove();
			$(this).css("border-color", "red");
			$(this).focus();
			$(this).after("<div id='instagram_message'>Please enter valid enter Instagram handle!</div>");
			$("#instagram_message").css("color", "red");
		} else {
			$("#instagram_message").remove();
			$(this).css("border-color", "inherit");
		}
	});


	// add tag to interests when selecting from data list
	/*$("#interests").on('change', 'input', function(){
	    var options = $('#interests_datalist')[0].options;
	    for (var i=0;i<options.length;i++){
	    	if (options[i].value == $(this).val()) {
	    		var li = $('<li>' + interest + '<span class="close">x</span></li>');
				$("#interests_list").append(li);
	    	}
	    }
	});*/

	// add tag to interests when user presses enter
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
		$(this).parent().remove();
	});

});