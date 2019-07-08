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
    <script>
        function sortTable(n) {
            var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
            table = document.getElementById("myTable2");
            switching = true;
            // Set the sorting direction to ascending:
            dir = "desc";
            /* Make a loop that will continue until
            no switching has been done: */
            while (switching) {
                // Start by saying: no switching is done:
                switching = false;
                rows = table.rows;
                /* Loop through all table rows (except the
                first, which contains table headers): */
                for (i = 1; i < (rows.length - 1); i++) {
                    // Start by saying there should be no switching:
                    shouldSwitch = false;
                    /* Get the two elements you want to compare,
                    one from current row and one from the next: */
                    x = rows[i].getElementsByTagName("TD")[n];
                    y = rows[i + 1].getElementsByTagName("TD")[n];
                    /* Check if the two rows should switch place,
                    based on the direction, asc or desc: */
                    if (dir == "asc") {
                        if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
                            // If so, mark as a switch and break the loop:
                            shouldSwitch = true;
                            break;
                        }
                    } else if (dir == "desc") {
                        if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
                            // If so, mark as a switch and break the loop:
                            shouldSwitch = true;
                            break;
                        }
                    }
                }
                if (shouldSwitch) {
                    /* If a switch has been marked, make the switch
                    and mark that a switch has been done: */
                    rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
                    switching = true;
                    // Each time a switch is done, increase this count by 1:
                    switchcount++;
                } else {
                    /* If no switching has been done AND the direction is "asc",
                    set the direction to "desc" and run the while loop again. */
                    if (switchcount == 0 && dir == "asc") {
                        dir = "desc";
                        switching = true;
                    }
                }
            }
        }
    </script>
</head>

<body onload="sortTable(10)">
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