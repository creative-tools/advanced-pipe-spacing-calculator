/**
 * Persistence Logic for Pipe Spacing Calculator
 * Handles JSON Export/Import of the session state
 */
const Persistence = {
    // Export all current inputs to a JSON file
    exportSession() {
        const groups = document.querySelectorAll(".pipe-row");
        const gap = document.getElementById("gap").value;
        const mode = document.querySelector('input[name="calcMode"]:checked').value;

        const sessionData = {
            metadata: {
                version: "1.0",
                timestamp: new Date().toISOString(),
                gap: gap,
                mode: mode
            },
            pipes: []
        };

        groups.forEach(row => {
            sessionData.pipes.push({
                name: row.querySelector(".p_name").value,
                size: row.querySelector(".p_size").value,
                cls: row.querySelector(".p_class").value,
                p_ins: row.querySelector(".p_ins").value,
                f_ins: row.querySelector(".f_ins").value,
                bop_enabled: row.querySelector(".bop_check").checked,
                bop_val: row.querySelector(".bop_val").value
            });
        });

        const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Pipe_Project_${new Date().getTime()}.json`;
        link.click();
    },

    // Import data from a JSON file and rebuild the UI
    importSession(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // --- SECURITY CHECK: Validate Schema ---
                if (!data.metadata || !Array.isArray(data.pipes)) {
                    throw new Error("File format not recognized. Missing 'metadata' or 'pipes'.");
                }
                
                // 1. Restore Global Settings
                document.getElementById("gap").value = data.metadata.gap;
                const modeRadio = document.querySelector(`input[name="calcMode"][value="${data.metadata.mode}"]`);
                if (modeRadio) modeRadio.checked = true;

                // 2. Clear existing pipes
                const container = document.getElementById("pipesContainer");
                container.innerHTML = "";

                // 3. Rebuild Pipe Rows
                data.pipes.forEach(p => {
                    createPipeUI(); 
                    const rows = document.querySelectorAll(".pipe-row");
                    const lastRow = rows[rows.length - 1];

                    lastRow.querySelector(".p_name").value = p.name;
                    lastRow.querySelector(".p_size").value = p.size;
                    lastRow.querySelector(".p_class").value = p.cls;
                    lastRow.querySelector(".p_ins").value = p.p_ins;
                    lastRow.querySelector(".f_ins").value = p.f_ins;
                    
                    const bopCheck = lastRow.querySelector(".bop_check");
                    const bopInput = lastRow.querySelector(".bop_val");
                    bopCheck.checked = p.bop_enabled;
                    bopInput.value = p.bop_val;
                    bopInput.disabled = !p.bop_enabled;
                });

                // 4. Refresh Calculations
                updateResult();
                alert("Project loaded successfully!");
            } catch (err) {
                // Modified to show the actual error message thrown
                alert("Error: " + err.message);
                console.error(err);
            } finally {
                //
                // Reset the file input so the 'change' event triggers next time
                event.target.value = "";
            }
        };
        reader.readAsText(file);
    }
};