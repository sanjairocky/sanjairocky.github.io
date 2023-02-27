const getExpenseHtml = ({
  persons,
  transactions,
}) => `<div style="width: 100%; height: 100%;"><style>
  table {
    font-family: arial, sans-serif;
    border-collapse: collapse;
    width: 100%;
  }
  td,th {
    border: 1px solid #dddddd;
    text-align: left;
    padding: 8px;
  }
  tr:nth-child(even) {
    background-color: #dddddd;
  }
</style>
<h2 style=" display: flex; justify-content: center; align-items: center;">Amount</h2>
<table>
  <thead>
    <tr>
      <th>Person</th>
      <th>Total Amount</th>
      <th>Total Spent</th>
      <th>Will Recieve</th>
      <th>Has to Pay</th>
    </tr>
  </thead>
  <tbody>
  ${Object.entries(persons).map(
    ([k, v]) => `<tr>
      <th>${k}</th>
      <th>${v.share}</th>
      <th>${v.spent}</th>
      <th>${v.amount > 0 ? v.amount : 0}</th>
      <th>${v.amount < 0 ? -1 * v.amount : 0}</th>
    </tr>`
  )}
  </tbody>
</table>
<h2 style=" display: flex; justify-content: center; align-items: center;">Pending Transactions</h2>
<table>
  <thead>
    <tr>
      <th>From</th>
      <th>To</th>
      <th>Amount</th>
    </tr>
  </thead>
  <tbody>
  ${transactions.map(
    (t) => `<tr>
      <th>${t.from}</th>
      <th>${t.to}</th>
      <th>${t.amount}</th>
    </tr>`
  )}
  </tbody>
</table></div>`;

const getLoader = () => `<style>
.loader {
  border: 16px solid #f3f3f3;
  border-radius: 50%;
  border-top: 16px solid #3498db;
  width: 120px;
  height: 120px;
  -webkit-animation: spin 2s linear infinite; /* Safari */
  animation: spin 2s linear infinite;
}

/* Safari */
@-webkit-keyframes spin {
  0% { -webkit-transform: rotate(0deg); }
  100% { -webkit-transform: rotate(360deg); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style><div class="loader"></div>`;

document.getElementById("myFile").addEventListener("change", () => {
  document.getElementById("result").innerHTML = getLoader();
  const file = document.getElementById("myFile").files[0];
  document.body.style.justifyContent = "";
  let reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function () {
    try {
      const result = parseCsv({ csvString: reader.result });
      const html = getExpenseHtml(result);
      document.getElementById("result").innerHTML = html;
    } catch (e) {
      document.getElementById("result").innerHTML = "error parsing file";
    }
  };
  reader.onerror = function () {
    document.getElementById("result").innerHTML = "error parsing file";
    console.log(reader.error);
  };
});
