
ZOHO.embeddedApp.on("PageLoad", async function (data) {

  console.log("This is testing by me");

  ZOHO.CRM.UI.Resize({ height: "90%", width: "90%" });

  const dealId = data.EntityId;


  console.log(data);
  console.log(dealId);

  let tableHTML = "";
  let tableHTML2 ="";

  try {

    const relatedResponse = await ZOHO.CRM.API.getRelatedRecords({
      Entity: "Deals",
      RecordID: dealId,
      RelatedList: "Capital_Investment_Projection",
      page: 1, per_page: 200
    });

    console.log(relatedResponse);
    const projections = relatedResponse.data;

    console.log("Projections : "+projections);

    if (projections && projections.length > 0) {
      const capitalRecord = projections[0]; // Taking the first related record

      console.log(capitalRecord);

    const getRecord = await ZOHO.CRM.API.getRecord({
      Entity: "Investment_Projection",
      RecordID: capitalRecord.id,
       // Use the actual API name of the related list
    });
    console.log(getRecord);
    console.log("Response : "+getRecord);
    console.log("This is testing");

      const subform = getRecord.data[0].CIP_Subform; // Use actual subform API name

      if (subform && subform.length > 0) {

     

tableHTML += `
  <table>
    <thead>
      <tr >
        <th>Year</th>

        <strong>
        ${subform.map(entry => `<th>${entry.Year}</th>`).join('')}
        <strong>
      </tr>
    </thead>
    <tbody>
      <tr class='htr' >
        <td><strong>Amount</strong></td>
        ${subform.map(entry => `<td>${entry.Amount}</td>`).join('')}
      </tr>
    </tbody>
  </table>
`;


  tableHTML2 += `
          <table>
            <thead>
              <tr>
                <th>Year</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
        `;
        subform.forEach(entry => {
          tableHTML2 += `<tr><td>${entry.Year}</td><td>${entry.Amount}</td></tr>`;
        });
        tableHTML2 += `</tbody></table>`;



      } else {
        tableHTML = `<div class="no-data">No data found in capital investment subform.</div>`;
        // tableHTML2 = `<div class="no-data">No data found in capital investment subform.</div>`;

      }
    } else {
      tableHTML = `<div class="no-data">No capital investment projection linked to this deal.</div>`;
    //   tableHTML2 = `<div class="no-data">No capital investment projection linked to this deal.</div>`;
    }
  } catch (err) {
    console.error("Error:", err);
    tableHTML = `<div class="no-data">An error occurred while fetching data.</div>`;
    // tableHTML2 = `<div class="no-data">An error occurred while fetching data.</div>`;
  }

  const table = document.getElementById("table-container");
  table.innerHTML = tableHTML;
  document.getElementById("table-container2").innerHTML = tableHTML2;

});

ZOHO.embeddedApp.init();
