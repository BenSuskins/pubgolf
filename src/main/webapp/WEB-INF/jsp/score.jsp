<!DOCTYPE html>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<html lang="en">
<style>
    @import url(https://fonts.googleapis.com/css?family=Roboto:400,300,600,400italic);
</style>
<head>
    <c:url value="styles.css" var="jstlCss"/>
    <link href="${jstlCss}" rel="stylesheet"/>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
    <title>Pub Golf -  ${name}!</title>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>
    <meta name="_csrf" content="${_csrf.token}"/>
    <meta name="_csrf_header" content="${_csrf.headerName}"/>
    <script>
        function submitScore() {
            var token = $("meta[name='_csrf']").attr("content");
            var header = $("meta[name='_csrf_header']").attr("content");

            $.ajax({
                url: '/submitscore',
                type: 'post',
                data: $('#pubgolf-score').serialize(),
                success: function () {
                    document.location.href = "/";
                },
                error: function () {
                    alert("error submitting, please try again")
                }
            });
        }
    </script>

    <script>
        function getUser() {
            $.get("/user", function (data) {
                document.getElementById("name").value = data.userAuthentication.details.name;
            });
        }
    </script>
</head>

<body onload="getUser()">
<div class="flex-container">
    <div class="container2">
        <form id="pubgolf-score">
            <h3>Pub Golf</h3>
            <h4>Submit your score.</h4>
            <fieldset>
                <input id="name" placeholder="Name" type="text" tabindex="0" name="name" required readonly>
            </fieldset>

            <select id="hole" name="hole" tabindex="1" required autofocus>
                <option value="" disabled selected hidden>Hole</option>
                <option value="1">1 - Tequila</option>
                <option value="2">2 - Beer</option>
                <option value="3">3 - Wine</option>
                <option value="4">4 - Cider</option>
                <option value="5">5 - Alcopop</option>
                <option value="6">6 - Spirit & Mixer</option>
                <option value="7">7 - Guiness</option>
                <option value="8">8 - Jägerbomb</option>
                <option value="9">9 - VK</option>
            </select>

            <fieldset>
                <input id="par" placeholder="Par" type="text" tabindex="0" name="par" required>
            </fieldset>

            <input type="hidden"
                   name="${_csrf.parameterName}"
                   value="${_csrf.token}"/>

            <fieldset>
                <button type="button" onclick="submitScore();">Submit</button>
            </fieldset>
        </form>
    </div>
</div>
</body>
</html>