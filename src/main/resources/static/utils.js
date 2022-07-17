function resetName() {
    $.ajax({
        url: '/api/v1/score?name=' + localStorage.getItem("name"),
        type: 'delete',
        success: function () {
           localStorage.setItem("name", "null");
           setName();
           setNameField();
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR.responseJSON.message);
            alert("Error resetting name, please check network and try again. " + jqXHR.responseJSON.message);
        }
    });
}

function setName() {
   let name = localStorage.getItem("name");
    if (!name | name === 'null') {
        name =  prompt("Please enter your name", "");
        if (!name.match(/^[a-zA-Z]+$/)) {
            setName();
        } else {
            localStorage.setItem("name", name);
        }
    }
}

function setNameField() {
    setName();
    let name = localStorage.getItem("name");
    document.getElementById("name").value = name;
}

function submitScore() {
    $.ajax({
        url: '/api/v1/score',
        type: 'post',
        data: $('#pubgolf-score').serialize(),
        success: function () {
            document.location.href = "/";
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR.responseJSON.message);
            alert("Error submitting score, please check input and try again. " + jqXHR.responseJSON.message);
        }
    });
}

function getScores() {
    setName();
    $.ajaxSetup({
        cache: false
    });

    $.ajax({
        url: '/api/v1/score',
        type: 'GET',
        dataType: 'json',
        success: function (response) {
            // Base Header Row to add to
            var trHTML = '<tr><th>Name</th><th>Hole 1</th><th>Hole 2</th><th>Hole 3</th>' +
            '<th>Hole 4</th><th>Hole 5</th><th>Hole 6</th><th>Hole 7</th>' +
            '<th>Hole 8</th><th>Hole 9</th><th>Score</th></tr>';
            $.each(response, function (i, element) {
                trHTML += '<tr><td>' + element.name + '</td><td>' + element.hole_one + '</td><td>' + element.hole_two + '</td><td>'
                    + element.hole_three + '</td><td>' + element.hole_four + '</td><td>' + element.hole_five + '</td><td>'
                    + element.hole_six + '</td><td>' + element.hole_seven + '</td><td>' + element.hole_eight + '</td><td>'
                    + element.hole_nine + '</td><td>' + element.score + '</td></tr>';
            });
            $('#scorestable').html(trHTML);
            setTimeout(getScores, 5000);
        },
        error: function (jqXHR, exception) {
            console.log(jqXHR.responseJSON.message);
        }
    });
}

function showOrHide() {
      var x = document.getElementById("hidden-container");
      if (x.style.display === "flex") {
        x.style.display = "none";
      } else {
        x.style.display = "flex";
      }
}
