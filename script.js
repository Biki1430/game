let drawnNumbers = [];
let autoPlayInterval = null;
let gameStarted = false;
let allTicketElements = [];
let ticketDataList = [];
let winnerSettings = [];
let winnerLog = [];

const maxTickets = 600;

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateTicket() {
  const ticket = Array.from({ length: 3 }, () => Array(9).fill(""));
  let columns = Array.from({ length: 9 }, (_, i) => {
    const start = i * 10 + 1;
    const end = i === 8 ? 90 : (i + 1) * 10;
    return shuffle(Array.from({ length: end - start + 1 }, (_, k) => k + start)).slice(0, 3);
  });

  for (let row = 0; row < 3; row++) {
    let placed = 0;
    while (placed < 5) {
      const col = Math.floor(Math.random() * 9);
      if (ticket[row][col] === "" && columns[col].length) {
        ticket[row][col] = columns[col].pop();
        placed++;
      }
    }
  }
  return ticket;
}

function renderTicket(ticket, index) {
  const table = document.createElement("table");
  ticket.forEach(row => {
    const tr = document.createElement("tr");
    row.forEach(num => {
      const td = document.createElement("td");
      td.textContent = num || "";
      if (num) td.setAttribute("data-number", num);
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  table.setAttribute("data-index", index);
  allTicketElements.push(table);
  return table;
}

window.generateBulkTickets = function () {
  const count = parseInt(document.getElementById("ticketCount").value);
  if (isNaN(count) || count < 1 || count > maxTickets) {
    alert(`Enter number between 1 and ${maxTickets}`);
    return;
  }

  const container = document.getElementById("bulkTicketContainer");
  container.innerHTML = "";
  allTicketElements = [];
  ticketDataList = [];

  for (let i = 0; i < count; i++) {
    const ticket = generateTicket();
    const data = {
      numbers: ticket,
      booked: false,
      name: "",
      mobile: "",
      winStatus: {}
    };
    ticketDataList.push(data);

    const wrapper = document.createElement("div");
    wrapper.className = "ticket-block";

    const header = document.createElement("h4");
    header.textContent = `Ticket ${i + 1}`;

    const table = renderTicket(ticket, i);
    table.addEventListener("click", () => {
      if (!data.booked) {
        openBookingModal(i);
      } else {
        showBookingDetails(data);
      }
    });

    wrapper.append(header, table);
    container.appendChild(wrapper);
  }
  updateAvailableDisplay();
};

function openBookingModal(index) {
  const name = prompt("Enter your name:");
  const mobile = prompt("Enter mobile number:");
  if (name && mobile) {
    ticketDataList[index].booked = true;
    ticketDataList[index].name = name;
    ticketDataList[index].mobile = mobile;
    alert(`Ticket ${index + 1} booked successfully.`);
    updateAvailableDisplay();
  }
}

function showBookingDetails(data) {
  alert(`Booked by: ${data.name}\nMobile: ${data.mobile}`);
}

function updateAvailableDisplay() {
  const availableBtn = document.getElementById("showAvailable");
  if (!availableBtn) return;

  const available = ticketDataList.filter(t => !t.booked).length;
  const booked = ticketDataList.length - available;

  document.getElementById("availableContainer").innerHTML = `
    <p><b>Total:</b> ${ticketDataList.length}</p>
    <p><b>Available:</b> ${available}</p>
    <p><b>Booked:</b> ${booked}</p>
    <div class="ticket-grid">
      ${ticketDataList.map((t, i) => `
        <button 
          class="ticket-num ${t.booked ? 'booked' : 'available'}" 
          onclick="handleTicketGridClick(${i})">
          ${i + 1}
        </button>
      `).join("")}
    </div>
  `;
}

window.handleTicketGridClick = function (index) {
  const ticket = ticketDataList[index];
  if (!ticket.booked) {
    openBookingModal(index);
  } else {
    showBookingDetails(ticket);
  }
};

window.drawNumber = function () {
  if (!gameStarted || drawnNumbers.length >= 90) return;

  let num;
  do {
    num = Math.floor(Math.random() * 90) + 1;
  } while (drawnNumbers.includes(num));

  drawnNumbers.push(num);
  document.getElementById("lastNumber").textContent = `Last: ${num}`;
  document.getElementById("lastNumber").classList.remove("pop");
  void document.getElementById("lastNumber").offsetWidth;
  document.getElementById("lastNumber").classList.add("pop");
  document.getElementById("drawnNumbers").textContent = drawnNumbers.join(", ");
  speakNumber(num);
  highlightNumber(num);
  checkWinners();
};
function speakNumber(num) {
  const utterance = new SpeechSynthesisUtterance(`Number ${num}`);
  utterance.lang = 'en-US'; // You can change to 'hi-IN' for Hindi, etc.
  speechSynthesis.speak(utterance);
}

function highlightNumber(num) {
  allTicketElements.forEach(table => {
    const cells = table.querySelectorAll(`[data-number='${num}']`);
    cells.forEach(cell => cell.classList.add("highlight"));
  });
}

window.toggleAutoPlay = function () {
  const toggle = document.getElementById("autoPlayToggle").checked;
  if (toggle) {
    autoPlayInterval = setInterval(drawNumber, 3000);
  } else {
    clearInterval(autoPlayInterval);
  }
};

window.saveWinnerSettings = function () {
  const checkboxes = document.querySelectorAll(".winner-setting input");
  winnerSettings = [];
  winnerLog = [];
  checkboxes.forEach(cb => {
    if (cb.checked) {
      winnerSettings.push(cb.value);
    }
  });
  alert("Winner rules saved.");
};

function checkWinners() {
  ticketDataList.forEach((ticket, index) => {
    if (!ticket.booked) return;

    const flat = ticket.numbers.flat().filter(Boolean);
    const matched = flat.filter(num => drawnNumbers.includes(num));

    if (
      matched.length === flat.length &&
      !ticket.winStatus["full-house"] &&
      winnerSettings.includes("full-house")
    ) {
      declareWinner("full-house", index);
    }

    if (
      winnerSettings.includes("top-line") &&
      !ticket.winStatus["top-line"] &&
      ticket.numbers[0].filter(Boolean).every(n => drawnNumbers.includes(n))
    ) {
      declareWinner("top-line", index);
    }

    if (
      winnerSettings.includes("middle-line") &&
      !ticket.winStatus["middle-line"] &&
      ticket.numbers[1].filter(Boolean).every(n => drawnNumbers.includes(n))
    ) {
      declareWinner("middle-line", index);
    }

    if (
      winnerSettings.includes("bottom-line") &&
      !ticket.winStatus["bottom-line"] &&
      ticket.numbers[2].filter(Boolean).every(n => drawnNumbers.includes(n))
    ) {
      declareWinner("bottom-line", index);
    }
  });

  if (
    winnerLog.length >= winnerSettings.length &&
    winnerSettings.length > 0
  ) {
    gameStarted = false;
    clearInterval(autoPlayInterval);
    alert("Game Over! All winners declared.");
  }
}

function declareWinner(type, ticketIndex) {
  if (winnerLog.includes(type)) return;
  winnerLog.push(type);
  ticketDataList[ticketIndex].winStatus[type] = true;
  const winnersList = document.getElementById("winnersList");
  const li = document.createElement("li");
  li.textContent = `${type.toUpperCase()} Winner: Ticket ${ticketIndex + 1} - ${ticketDataList[ticketIndex].name}`;
  winnersList.appendChild(li);
}

window.resetGame = function () {
  clearInterval(autoPlayInterval);
  drawnNumbers = [];
  gameStarted = false;
  winnerLog = [];

  document.getElementById("drawnNumbers").textContent = "";
  document.getElementById("lastNumber").textContent = "";
  document.getElementById("winnersList").innerHTML = "";
  allTicketElements = [];
  document.getElementById("bulkTicketContainer").innerHTML = "";
  document.getElementById("availableContainer").innerHTML = "";
};

window.startGame = function () {
  gameStarted = true;
  alert("Game Started!");
};

window.onload = () => {
  updateAvailableDisplay();
};
