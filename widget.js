




    



let sessionId = null;
let attendanceRecords = [];
let currentPage = 1;
const recordsPerPage = 10; // Changed from 9 to 10
let selectedRecordIds = new Set(); // Using a Set for efficient ID management


// Message handling functions
function showMessage(message, type = 'success', duration = 5000) {
  const messageContainer = document.getElementById('messageContainer');
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  
  messageContainer.innerHTML = `
    <span class="message-icon">${icons[type]}</span>
    <span>${message}</span>
  `;
  
  messageContainer.className = `message-container ${type}`;
  
  // Auto hide after duration
  setTimeout(() => {
    hideMessage();
  }, duration);
}

function hideMessage() {
  const messageContainer = document.getElementById('messageContainer');
  messageContainer.classList.add('hidden');
}

function showLoading() {
  document.getElementById('loadingIndicator').classList.remove('hidden');
  document.getElementById('attendanceTable').classList.add('hidden');
  document.getElementById('submitButton').classList.add('hidden');
  document.getElementById('noRecordsMessage').classList.add('hidden');
}

function hideLoading() {
  document.getElementById('loadingIndicator').classList.add('hidden');
}

function showNoRecords() {
  document.getElementById('noRecordsMessage').classList.remove('hidden');
  document.getElementById('attendanceTable').classList.add('hidden');
  document.getElementById('submitButton').classList.add('hidden');
}

function showTable() {
    document.getElementById('attendanceTable').classList.remove('hidden');
    document.getElementById('submitButton').classList.remove('hidden');
    document.getElementById('submitButton').disabled = false;
    document.getElementById('noRecordsMessage').classList.add('hidden');
    document.getElementById('paginationControls').classList.remove('hidden');

    document.getElementById('massUpdateButton').classList.remove('hidden');
    document.getElementById('massUpdateButton').disabled = false;

}
  

function setButtonLoading(loading) {
  const button = document.getElementById('submitButton');
  const buttonText = document.getElementById('buttonText');
  const buttonSpinner = document.getElementById('buttonSpinner');
  
  if (loading) {
    button.disabled = true;
    buttonText.textContent = 'Updating...';
    buttonSpinner.classList.remove('hidden');
  } else {
    button.disabled = false;
    buttonText.textContent = 'Submit Attendance';
    buttonSpinner.classList.add('hidden');
  }
}


ZOHO.embeddedApp.on("PageLoad", async function(data) {
    try {
      showLoading();
      hideMessage();
      
      sessionId = data.EntityId;
      console.log('Session ID:', sessionId);
  
      if (!sessionId) {
        throw new Error('No session ID provided');
      }
  
      ZOHO.CRM.UI.Resize({height:"100%",width:"100%"});
  
      // Get Sessions record details
      try {
        const sessionResp = await ZOHO.CRM.API.getRecord({ 
          Entity: "Sessions", 
          RecordID: sessionId 
        });
        
        if (!sessionResp.data || sessionResp.data.length === 0) {
          throw new Error('Session record not found');
        }
        
        const sessionData = sessionResp.data[0];
        console.log('Session Data:', sessionData);
        
        const batchName = sessionData.Batch?.name || 'N/A';
        const sessionName = sessionData.Name || 'N/A';
        
        document.getElementById("sessionInfo").innerHTML = 
          `Batch: <strong>${batchName}</strong> | Session: <strong>${sessionName}</strong>`;
          
      } catch (error) {
        console.error('Error fetching session details:', error);
        showMessage('Failed to load session details. Please try again.', 'error');
        document.getElementById("sessionInfo").innerHTML = 'Error loading session details';
      }
  
      // Fetch Attendance related list
      try {
        let allFetchedRecords = [];
        let page = 1;
        const perPage = 200; // Max records per page for Zoho CRM API
  
        while (true) {
          const attendanceResp = await ZOHO.CRM.API.getRelatedRecords({
            Entity: "Sessions",
            RecordID: sessionId,
            RelatedList: "Attendance",
            page: page,
            perPage: perPage
          });
          
          console.log(`Attendance Response (Page ${page}):`, attendanceResp);
          
          if (attendanceResp.data && attendanceResp.data.length > 0) {
            allFetchedRecords = allFetchedRecords.concat(attendanceResp.data);
            if (attendanceResp.data.length < perPage) {
              // Last page, fetched less than perPage records
              break;
            }
            page++;
          } else {
            // No more data or initial call returned no data
            break;
          }
        }
        
        attendanceRecords = allFetchedRecords;
  
        if (attendanceRecords.length === 0) {
          hideLoading();
          showNoRecords();
          showMessage('No attendance records found for this session.', 'warning');
          return;
        }
        
        hideLoading();
        buildTable(attendanceRecords);
        showTable();
        
        showMessage(
          `Loaded ${attendanceRecords.length} attendance record${attendanceRecords.length !== 1 ? 's' : ''} successfully.`, 
          'success', 
          3000
        );
        
      } catch (error) {
        console.error('Error fetching attendance records:', error);
        hideLoading();
        showNoRecords();
        
        if (error.message && error.message.includes('INVALID_DATA')) {
          showMessage('No attendance records available for this session.', 'warning');
        } else {
          showMessage('Failed to load attendance records. Please check your connection and try again.', 'error');
        }
      }
      
    } catch (error) {
      console.error('Error in PageLoad:', error);
      hideLoading();
      showMessage('Failed to initialize the widget. Please refresh and try again.', 'error');
    }
  });


// ZOHO.embeddedApp.on("PageLoad", async function(data) {
//   try {
//     showLoading();
//     hideMessage();
    
//     sessionId = data.EntityId;
//     console.log('Session ID:', sessionId);

//     if (!sessionId) {
//       throw new Error('No session ID provided');
//     }

//     ZOHO.CRM.UI.Resize({height:"100%",width:"100%"});

//     // Get Sessions record details
//     try {
//       const sessionResp = await ZOHO.CRM.API.getRecord({ 
//         Entity: "Sessions", 
//         RecordID: sessionId 
//       });
      
//       if (!sessionResp.data || sessionResp.data.length === 0) {
//         throw new Error('Session record not found');
//       }
      
//       const sessionData = sessionResp.data[0];
//       console.log('Session Data:', sessionData);
      
//       const batchName = sessionData.Batch?.name || 'N/A';
//       const sessionName = sessionData.Name || 'N/A';
      
//       document.getElementById("sessionInfo").innerHTML = 
//         `Batch: <strong>${batchName}</strong> | Session: <strong>${sessionName}</strong>`;
        
//     } catch (error) {
//       console.error('Error fetching session details:', error);
//       showMessage('Failed to load session details. Please try again.', 'error');
//       document.getElementById("sessionInfo").innerHTML = 'Error loading session details';
//     }

//     // Fetch Attendance related list
//     try {

//       const attendanceResp = await ZOHO.CRM.API.getRelatedRecords({
//         Entity: "Sessions",
//         RecordID: sessionId,
//         RelatedList: "Attendance"
//       });
      
//       console.log('Attendance Response:', attendanceResp);
      
//       if (!attendanceResp.data || attendanceResp.data.length === 0) {
//         hideLoading();
//         showNoRecords();
//         showMessage('No attendance records found for this session.', 'warning');
//         return;
//       }
      
//       attendanceRecords = attendanceResp.data;
//       hideLoading();
//       buildTable(attendanceRecords);
//       showTable();
      
//       showMessage(
//         `Loaded ${attendanceRecords.length} attendance record${attendanceRecords.length !== 1 ? 's' : ''} successfully.`, 
//         'success', 
//         3000
//       );


      
//     } catch (error) {
//       console.error('Error fetching attendance records:', error);
//       hideLoading();
//       showNoRecords();
      
//       if (error.message && error.message.includes('INVALID_DATA')) {
//         showMessage('No attendance records available for this session.', 'warning');
//       } else {
//         showMessage('Failed to load attendance records. Please check your connection and try again.', 'error');
//       }
//     }
    
//   } catch (error) {
//     console.error('Error in PageLoad:', error);
//     hideLoading();
//     showMessage('Failed to initialize the widget. Please refresh and try again.', 'error');
//   }
// });


function buildTable(records) {
    try {
      const tbody = document.querySelector("#attendanceTable tbody");
      tbody.innerHTML = "";
  
      // Calculate current page slice
      const startIndex = (currentPage - 1) * recordsPerPage;
      const endIndex = startIndex + recordsPerPage;
      const pageRecords = records.slice(startIndex, endIndex);
  
      pageRecords.forEach((rec, idx) => {
        const row = document.createElement("tr");
        const attendanceName = rec.Name || `Record ${startIndex + idx + 1}`;
        const contactName = rec.Contact?.name || 'N/A';
        const dealName = rec.Deal?.name || 'N/A';
        const currentAttendance = rec.Session_Attended?.trim() || '';
        const isSelected = selectedRecordIds.has(rec.id); // Check if this record is selected

        row.innerHTML = `
        <td><input type="checkbox" class="rowCheckbox" data-id="${rec.id}" ${isSelected ? 'checked' : ''}></td>
        <td>${attendanceName}</td>
        <td>${contactName}</td>
        <td>${dealName}</td>
        <td>
            <select id="attended_${startIndex + idx}">
            <option value="" ${currentAttendance === "" ? "selected" : ""}></option>
            <option value="Yes" ${currentAttendance === "Yes" ? "selected" : ""}>Yes</option>
            <option value="No" ${currentAttendance === "No" ? "selected" : ""}>No</option>
            </select>
        </td>
        `;

        tbody.appendChild(row);

        // Add event listener to update the attendanceRecords array directly
        row.querySelector(`#attended_${startIndex + idx}`).addEventListener("change", (e) => {
            attendanceRecords[startIndex + idx].Session_Attended = e.target.value;
        });

        // Add event listener for individual checkbox selection
        row.querySelector(`.rowCheckbox`).addEventListener("change", (e) => {
            const recordId = e.target.dataset.id;
            if (e.target.checked) {
                selectedRecordIds.add(recordId);
            } else {
                selectedRecordIds.delete(recordId);
            }
            updateHeaderCheckbox(); // Update header checkbox state
        });
      });
  
      updatePaginationControls();
      updateHeaderCheckbox(); // Update header checkbox after building table
    } catch (error) {
      console.error('Error building table:', error);
      showMessage('Error displaying attendance records.', 'error');
    }
  }

function updateHeaderCheckbox() {
    const headerCheckbox = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.rowCheckbox');
    if (checkboxes.length === 0) {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = false;
        return;
    }
    const allCheckedOnPage = Array.from(checkboxes).every(cb => cb.checked);
    const anyCheckedOnPage = Array.from(checkboxes).some(cb => cb.checked);

    if (allCheckedOnPage) {
        headerCheckbox.checked = true;
        headerCheckbox.indeterminate = false;
    } else if (anyCheckedOnPage) {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = true;
    } else {
        headerCheckbox.checked = false;
        headerCheckbox.indeterminate = false;
    }
}


function updatePaginationControls() {
    const totalPages = Math.ceil(attendanceRecords.length / recordsPerPage);
    document.getElementById('prevButton').disabled = currentPage === 1;
    document.getElementById('nextButton').disabled = currentPage === totalPages || totalPages === 0;

    // Updated line to include total record count
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages} (${attendanceRecords.length} records)`;
}
    

async function submitAttendance() {
  try {
    setButtonLoading(true);
    hideMessage();
    
    if (!attendanceRecords || attendanceRecords.length === 0) {
      showMessage('No attendance records to update.', 'warning');
      setButtonLoading(false);
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < attendanceRecords.length; i++) {
      try {
        const recId = attendanceRecords[i].id;
        const attended = attendanceRecords[i].Session_Attended || ""; // Get value directly from the array
        
        if (!recId) {
          throw new Error(`Invalid record ID for record ${i + 1}`);
        }
        
        const updateResp = await ZOHO.CRM.API.updateRecord({
          Entity: "Attendance",
          APIData: { "Session_Attended" : attended,
                     "id" : recId 
          }
        });
        
        console.log(`Update response for record ${i + 1}:`, updateResp);
        
        if (updateResp.data && updateResp.data[0] && updateResp.data[0].code === "SUCCESS") {
          successCount++;
        } else {
          throw new Error(updateResp.data?.[0]?.message || 'Update failed');
        }
        
      } catch (error) {
        console.error(`Error updating record ${i + 1}:`, error);
        errorCount++;
        errors.push(`Record ${i + 1}: ${error.message}`);
      }
    }
    
    setButtonLoading(false);
    
    // Show results
    if (errorCount === 0) {
      showMessage(
        `🎉 All ${successCount} attendance record${successCount !== 1 ? 's' : ''} updated successfully!`, 
        'success'
      );
      
      // Close popup after successful update
      setTimeout(() => {
        ZOHO.CRM.UI.Popup.close();
      }, 2000);
      
    } else if (successCount > 0) {
      showMessage(
        `⚠️ Partially completed: ${successCount} record${successCount !== 1 ? 's' : ''} updated successfully, ${errorCount} failed. Check console for details.`, 
        'warning',
        8000
      );
      console.error('Update errors:', errors);
      
    } else {
      showMessage(
        `❌ Failed to update any records. Please check your permissions and try again.`, 
        'error',
        8000
      );
      console.error('All update errors:', errors);
    }
    
  } catch (error) {
    console.error('Error in submitAttendance:', error);
    setButtonLoading(false);
    showMessage('An unexpected error occurred while updating attendance. Please try again.', 'error');
  }
}

function nextPage() {
    const totalPages = Math.ceil(attendanceRecords.length / recordsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      buildTable(attendanceRecords);
    }
  }
  
  function prevPage() {
    if (currentPage > 1) {
      currentPage--;
      buildTable(attendanceRecords);
    }
  }
  
function toggleSelectAll(master) {
    const checkboxes = document.querySelectorAll('.rowCheckbox');
    const currentMasterChecked = master.checked;

    checkboxes.forEach(cb => {
        cb.checked = currentMasterChecked;
        const recordId = cb.dataset.id;
        if (currentMasterChecked) {
            selectedRecordIds.add(recordId);
        } else {
            selectedRecordIds.delete(recordId);
        }
    });

    // We only change the records on the current page, so the master checkbox will reflect this.
    // However, selectedRecordIds stores all selected records across pages.
    // To implement "select all across all pages," the logic would need to change.
    // For now, "select all" only applies to the records currently displayed.

    updateHeaderCheckbox(); // Ensure header checkbox state is consistent
}
  
function massUpdate() {
    // Only allow mass update if there are records selected across all pages
    if (selectedRecordIds.size === 0) {
      showMessage('Please select at least one record.', 'warning');
      return;
    }
  
    // Show modal
    document.getElementById('massUpdateModal').classList.remove('hidden');
  }
  
  
  
  function closeMassUpdateModal() {
    document.getElementById('massUpdateModal').classList.add('hidden');
    document.getElementById('massUpdateValue').value = '';
  }
  
  async function applyMassUpdate() {
    const newValue = document.getElementById('massUpdateValue').value;
    if (newValue !== 'Yes' && newValue !== 'No') {
      showMessage('Please select Yes or No.', 'error');
      return;
    }
  
    if (selectedRecordIds.size === 0) {
      showMessage('No records selected.', 'warning');
      closeMassUpdateModal();
      return;
    }
  
    setButtonLoading(true);
    let success = 0;
    let errorCount = 0;
    const errors = [];
  
    // Iterate over the stored attendanceRecords to update selected ones
    for (let i = 0; i < attendanceRecords.length; i++) {
        const rec = attendanceRecords[i];
        if (selectedRecordIds.has(rec.id)) {
            try {
                const recId = rec.id;
                
                const updateResp = await ZOHO.CRM.API.updateRecord({
                    Entity: "Attendance",
                    APIData: { 
                        "Session_Attended": newValue,
                        "id" : recId
                    }
                });
            
                console.log(`Mass update response for record ${recId}:`, updateResp);
            
                if (updateResp.data && updateResp.data[0] && updateResp.data[0].code === "SUCCESS") {
                    // Update the local attendanceRecords array for the specific record
                    attendanceRecords[i].Session_Attended = newValue;
                    success++;
                } else {
                    throw new Error(updateResp.data?.[0]?.message || 'Update failed');
                }
            } catch (error) {
                console.error(`Error mass updating record ${rec.id}:`, error);
                errorCount++;
                errors.push(`Record ${rec.id}: ${error.message}`);
            }
        }
    }
    
    // Clear selection after mass update
    selectedRecordIds.clear();
    
    setButtonLoading(false);
    closeMassUpdateModal();
    buildTable(attendanceRecords); // Rebuild table to reflect changes and reset checkboxes

    if (errorCount === 0) {
        showMessage(
          `🎉 All ${success} selected attendance record${success !== 1 ? 's' : ''} mass updated successfully!`, 
          'success'
        );
      } else if (success > 0) {
        showMessage(
          `⚠️ Partially completed: ${success} record${success !== 1 ? 's' : ''} mass updated successfully, ${errorCount} failed. Check console for details.`, 
          'warning',
          8000
        );
        console.error('Mass update errors:', errors);
      } else {
        showMessage(
          `❌ Failed to mass update any records. Please check your permissions and try again.`, 
          'error',
          8000
        );
        console.error('All mass update errors:', errors);
      }
  }
  

  // Initialize the app
try {
    ZOHO.embeddedApp.init();
  } catch (error) {
    console.error('Error initializing ZOHO app:', error);
    showMessage('Failed to initialize the application. Please refresh the page.', 'error');
  }

