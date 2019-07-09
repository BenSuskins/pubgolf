<!DOCTYPE html>
<html lang="en">
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<style>
    @import url(https://fonts.googleapis.com/css?family=Open+Sans:300,400,700&display=swap);
</style>
<head>
    <c:url value="styles.css" var="jstlCss"/>
    <link href="${jstlCss}" rel="stylesheet"/>
    <title>Pub Golf</title>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type"/>
</head>

<body>
<div class="flex-container">
    <div class="container2">
        <form id="pubgolf-div">
            <h3>Pub Golf</h3>
            <table id="myTable2" style="width: 100%">
                <tr>
                    <th>Name</th>
                    <th>Hole 1</th>
                    <th>Hole 2</th>
                    <th>Hole 3</th>
                    <th>Hole 4</th>
                    <th>Hole 5</th>
                    <th>Hole 6</th>
                    <th>Hole 7</th>
                    <th>Hole 8</th>
                    <th>Hole 9</th>
                    <th>Score</th>
                </tr>
                <c:forEach var="user" items="${users}">
                    <tr th:each="user: ${users}">
                        <td> ${user.name}</td>
                        <td> ${user.hole_1}</td>
                        <td> ${user.hole_2}</td>
                        <td> ${user.hole_3}</td>
                        <td> ${user.hole_4}</td>
                        <td> ${user.hole_5}</td>
                        <td> ${user.hole_6}</td>
                        <td> ${user.hole_7}</td>
                        <td> ${user.hole_8}</td>
                        <td> ${user.hole_9}</td>
                        <td> ${user.score}</td>
                    </tr>
                </c:forEach>
            </table>
        </form>
    </div>
</div>


<div class="flex-container">
    <div class="container2">
        <form id="pubgolf-div" method="get" action="/score">
            <button type="submit">Submit Score</button>
        </form>
    </div>
</div>
<div class="flex-container">
    <div class="container2">
        <form id="pubgolf-div" method="get" action="/rules.html">
            <button type="submit">Info</button>
        </form>
    </div>
</div>

</body>
</html>