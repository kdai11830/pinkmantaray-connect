	// file for jQuery functions

$(document).ready(function() {

	console.log("JS SCRIPT RUNNING");

	var currentTab = 0;
	showTab(currentTab);

	function showTab(n) {
		$(".tab")[n].css("display", "block");

		if (n === 0) {
			$("#prevBtn").hide();
			$("#nextBtn").html("I Agree")
		} else {
			$("#prevBtn").show();
		}

		if (n === ($(".tab").length - 1)) {
			$("#nextBtn").html("Submit");
		} else {
			$("#nextBtn").html("Next");
		}

		fixStepIndicator(n);
	}

	function nextPrev(n) {
		if (n===1 && !validateForm()) return false;

		$(".tab")[currentTab].hide();
		currentTab += n;
		if (currentTab >= $(".tab").length) {
			$("#main").submit();
			return false;
		}

		showTab(currentTab);
	}

	function validateForm() {
		var valid = true;
		var reqInputs = $(".tab")[currentTab].find(".required");
		for (var i = 0; i < reqInputs.length; i++) {
			if (reqInputs[i].val() === "") {
				valid = false;
				reqInputs[i].css("border-color", "red");
			} else {
				reqInputs[i].css("border-color", "inherit");
			}
		}
		return valid;
	}

	function fixStepIndicator(n) {
		for (var i = 0; i < $(".step").length; i++) {
			$(".step")[i].attr("class", "step");
		}
		$(".step")[n].attr("class", "step active");
	}

	$("#prevBtn").click(function() {
		nextPrev(-1);
	});

	$("#nextBtn").click(function() {
		nextPrev(1);
	})


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
					// insert interest as hidden input with list attribute
					$("#interests_list").after('<input type="hidden" id="entry_interest" name="entry_interest[] value="' + interest + '">');

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

});