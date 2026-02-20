/* CORE CALCULATION LOGIC  */
function calculateC2C(p1_diam, p1_ins, f1_diam, f1_ins, p2_diam, p2_ins, f2_diam, f2_ins, gap) {
    const dist_1 = (p1_diam / 2) + p1_ins + (f2_diam / 2) + f2_ins + gap;
    const dist_2 = (p2_diam / 2) + p2_ins + (f1_diam / 2) + f1_ins + gap;
    const rawResult = Math.max(dist_1, dist_2);
    return Math.ceil(rawResult / 5) * 5;
}

/**
 * Creates a new pipe input row and adds it to the DOM
 */
function createPipeUI() {
    const container = document.getElementById("pipesContainer");
    const row = document.createElement("div"); // Variable is named 'row'
    row.className = "pipe-row";

    row.innerHTML = `
<div class="pipe-group">
        <div class="header-row">
            <h4 class="pipe-label">Pipe</h4>
            <button type="button" class="remove-btn">Remove</button>
        </div>            <div class="name-row">
                <label style="font-weight: bold;">Pipeline</label>
                <input type="text" class="p_name" placeholder="Name" style="flex: 1;">
              
            </div>
            
            <label>NPS:</label> 
            <select class="p_size"></select> 
            
            <label>Pipe OD:</label>
            <span class="p_od_disp"></span>
            
            <label>Class:</label> 
            <select class="p_class"></select>
            
            <label>Flg OD:</label>
            <span class="f_od_disp"></span>
            
            <label>Insul (mm):</label> 
            <input type="number" class="p_ins" value="0" min="0">
            
            <label>Flg Ins (mm):</label> 
            <input type="number" class="f_ins" value="0" min="0">
            
            <label>BOP (mm):</label>
            <div style="display: flex; gap: 5px; align-items: center;">
                <input type="checkbox" class="bop_check" title="Enable Custom BOP">
                <input type="number" class="bop_val" value="0" step="1" disabled style="width: 100%;">
            </div>

        </div>
        <div class="result-column"></div>    `;
    container.appendChild(row);

    const pipeSizes = Object.keys(PIPE_DATA["NPS"]).sort((a, b) => parseFloat(a) - parseFloat(b));
    const flangeClasses = Object.keys(FLANGE_RATINGS);
    const sizeSelect = row.querySelector(".p_size");
    const classSelect = row.querySelector(".p_class");
    const fill = (el, opts, isSize) => {
        opts.forEach(opt => {
            const o = document.createElement("option");
            o.value = opt;
            o.text = isSize ? opt + '"' : opt;
            el.appendChild(o);
        });
    };

    fill(sizeSelect, pipeSizes, true);
    fill(classSelect, flangeClasses, false);

    const updateInfo = () => {
        const size = sizeSelect.value;
        const cls = classSelect.value;
        const pOD = PIPE_DATA["NPS"][size];
        row.querySelector(".p_od_disp").innerText = pOD ? `${pOD}mm` : "";
        const fOD = FLANGE_RATINGS[cls] ? FLANGE_RATINGS[cls][size] : undefined;
        row.querySelector(".f_od_disp").innerText = fOD ? `${fOD}mm` : "(-)";
    };

    row.querySelectorAll("select, input").forEach(el => {
        el.addEventListener("change", () => {
            updateInfo();
            updateResult();
        });
        el.addEventListener("keyup", updateResult);
    });
    
    // BOP Checkbox Logic
    const bopCheck = row.querySelector(".bop_check");
    const bopInput = row.querySelector(".bop_val");
    
    bopCheck.addEventListener("change", () => {
        bopInput.disabled = !bopCheck.checked;
        if (!bopCheck.checked) bopInput.value = 0; // Optional: Reset to 0 if unchecked
        updateResult();
    });

    row.querySelector(".remove-btn").addEventListener("click", () => {
        if (document.querySelectorAll(".pipe-row").length > 2) {
            row.remove();
            updateResult();
        } else {
            alert("Minimum of 2 pipes required.");
        }
    });

    updateInfo();
}

function updateResult() {
    const rows = document.querySelectorAll(".pipe-row");
    const gap = parseInt(document.getElementById("gap").value) || 0;
    const mode = document.querySelector('input[name="calcMode"]:checked').value;
    const totalEl = document.getElementById("totalSpacingDisplay");
    let sumC2C = 0;
    let hasError = false;

    rows.forEach((row, i) => {
        const group = row.querySelector(".pipe-group");
        const resCol = row.querySelector(".result-column");
        group.querySelector(".pipe-label").innerText = `Pipe ${i + 1}`;

        if (i === rows.length - 1) {
            resCol.innerHTML = `<span class="label">-</span>`;
            return;
        }

        const size1 = row.querySelector(".p_size").value;
        const cls1 = row.querySelector(".p_class").value;
        const p1_od = PIPE_DATA["NPS"][size1];
        const f1_od = FLANGE_RATINGS[cls1] ? FLANGE_RATINGS[cls1][size1] : undefined;
        const p1_ins = parseInt(row.querySelector(".p_ins").value) || 0;
        const f1_ins = parseInt(row.querySelector(".f_ins").value) || 0;

        const nextRow = rows[i + 1];
        const size2 = nextRow.querySelector(".p_size").value;
        const cls2 = nextRow.querySelector(".p_class").value;
        const p2_od = PIPE_DATA["NPS"][size2];
        const f2_od = FLANGE_RATINGS[cls2] ? FLANGE_RATINGS[cls2][size2] : undefined;
        const p2_ins = parseInt(nextRow.querySelector(".p_ins").value) || 0;
        const f2_ins = parseInt(nextRow.querySelector(".f_ins").value) || 0;

        // Safety Check: Validate flange data existence for 'pipe-flange' mode
        if (mode === 'pf' && (f1_od === undefined || f2_od === undefined)) {
            resCol.innerHTML = `
                <span class="label">Center to Center</span>
                <div class="value" style="color: #dc3545; font-size: 1em;">Invalid Size-Class</div>
            `;
            hasError = true;
            return;
        }

        let result = 0;
        if (mode === 'pp') {
            const raw = (p1_od / 2) + p1_ins + (p2_od / 2) + p2_ins + gap;
            result = Math.ceil(raw / 5) * 5;
        } else {
            result = calculateC2C(p1_od, p1_ins, f1_od, f1_ins, p2_od, p2_ins, f2_od, f2_ins, gap);
        }

        resCol.innerHTML = `
            <span class="label">Center to Center</span>
            <span class="label">Pipe ${i+1} - Pipe ${i+2}</span>
            <div class="value">${result} mm</div>
        `;
        sumC2C += result;
    });

// Total spacing calculation (Edge of Pipe 1 Insulation to Edge of Pipe N Insulation) 
    if (rows.length >= 2 && !hasError) {
        const firstSize = rows[0].querySelector(".p_size").value;
        const lastSize = rows[rows.length - 1].querySelector(".p_size").value;
        
        const firstOD = PIPE_DATA["NPS"][firstSize] || 0;
        const lastOD = PIPE_DATA["NPS"][lastSize] || 0;
        
        // Get pipe insulation (not flange) for the first and last rows
        const firstIns = parseInt(rows[0].querySelector(".p_ins").value) || 0;
        const lastIns = parseInt(rows[rows.length - 1].querySelector(".p_ins").value) || 0;

        // Formula: Sum of C2C + Radius1 + Insul1 + RadiusN + InsulN
        const totalSpacing = sumC2C + (firstOD / 2) + firstIns + (lastOD / 2) + lastIns;
        
        totalEl.innerHTML = `Total Required Spacing (Incl. Insul): ${totalSpacing.toFixed(1)} mm`;
    } else {
        totalEl.innerHTML = hasError ? "Check Pipe Data" : "";
    }}
/* INITIALIZATION */
window.addEventListener('DOMContentLoaded', () => {
    // 1. Setup the Add button
    document.getElementById("addPipeBtn").onclick = () => {
        createPipeUI();
        updateResult();
    };
    
    // 2. Listeners for Settings
    document.getElementById("gap").oninput = updateResult;
    
    // NEW: Listener for Radio Buttons
    document.querySelectorAll('input[name="calcMode"]').forEach(radio => {
        radio.addEventListener("change", updateResult);
    });

    // 3. Clear container and start with 2 pipes
    const container = document.getElementById("pipesContainer");
    container.innerHTML = ""; 
    
    createPipeUI();
    createPipeUI();
    
    updateResult();
});

/**
 * Bridge function to collect data and trigger DXF download
 */
 function downloadDXF() {
    const groups = document.querySelectorAll(".pipe-group");
    const gap = parseInt(document.getElementById("gap").value) || 0;
    const mode = document.querySelector('input[name="calcMode"]:checked').value;
    
    // --- 1. PRE-VALIDATION GUARD CLAUSE ---
    // Check all pipes for missing data BEFORE generating any DXF strings
    for (let i = 0; i < groups.length; i++) {
        const size = groups[i].querySelector(".p_size").value;
        const cls = groups[i].querySelector(".p_class").value;
        
        // Check if Flange Data exists in our FLANGE_RATINGS object
        const f_od = FLANGE_RATINGS[cls] ? FLANGE_RATINGS[cls][size] : undefined;

        if (f_od === undefined) {
            alert(`EXPORT FAILED\n\nData missing for Pipe ${i + 1}: [NPS: ${size} - Class: ${cls}]\n\nPlease select a valid Flange Class or Size.`);
            return; // STOP execution here
        }
    }

    // --- 2. DATA COLLECTION ---
    // 
    let pipeConfigs = [];
    groups.forEach((g, i) => {
        const size = g.querySelector(".p_size").value;
        const cls = g.querySelector(".p_class").value;
        const p_od = PIPE_DATA["NPS"][size];
        const f_od = FLANGE_RATINGS[cls][size];

        let c2c_to_prev = 0;
        if (i > 0) {
            const prevGroup = groups[i-1];
            const p1_od = PIPE_DATA["NPS"][prevGroup.querySelector(".p_size").value];
            const p1_ins = parseInt(prevGroup.querySelector(".p_ins").value) || 0;
            const f1_od = FLANGE_RATINGS[prevGroup.querySelector(".p_class").value][prevGroup.querySelector(".p_size").value];
            const f1_ins = parseInt(prevGroup.querySelector(".f_ins").value) || 0;
            
            const p2_ins = parseInt(g.querySelector(".p_ins").value) || 0;
            const f2_ins = parseInt(g.querySelector(".f_ins").value) || 0;

            if (mode === 'pp') {
                const raw = (p1_od / 2) + p1_ins + (p_od / 2) + p2_ins + gap;
                c2c_to_prev = Math.ceil(raw / 5) * 5;
            } else {
                c2c_to_prev = calculateC2C(p1_od, p1_ins, f1_od, f1_ins, p_od, p2_ins, f_od, f2_ins, gap);
            }
        }

        // Calculate BOP
        const isBopEnabled = g.querySelector(".bop_check").checked;
        const bopVal = isBopEnabled ? (parseInt(g.querySelector(".bop_val").value) || 0) : 0;

        pipeConfigs.push({
            name: g.querySelector(".p_name").value || "Name",
            p_od: p_od,
            f_od: f_od,
            p_ins: parseInt(g.querySelector(".p_ins").value) || 0,
            f_ins: parseInt(g.querySelector(".f_ins").value) || 0,
            c2c_to_prev: c2c_to_prev,
            bop: bopVal // New Field
        });
});

    // --- 3. DXF GENERATION ---
    const sumC2C = pipeConfigs.reduce((sum, p) => sum + p.c2c_to_prev, 0);
    const r1 = pipeConfigs[0].p_od / 2;
    const rn = pipeConfigs[pipeConfigs.length - 1].p_od / 2;
    const totalSpacing = sumC2C + r1 + rn;

    // Pass 'mode' so the generator knows whether to draw flanges
    const dxfContent = DXFWriter.generate(pipeConfigs, totalSpacing, mode);
    
    // --- 4. TRIGGER DOWNLOAD ---
    const blob = new Blob([dxfContent], { type: "application/dxf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Pipe_Arrangement_${new Date().getTime()}.dxf`;
    link.click();
}

function downloadPDF() {
    const groups = document.querySelectorAll(".pipe-group");
    const gap = parseInt(document.getElementById("gap").value) || 0;
    const mode = document.querySelector('input[name="calcMode"]:checked').value;
    const totalText = document.getElementById("totalSpacingDisplay").innerText;

    let pipeConfigs = [];

    // Loop through all pipes
    for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        const size = g.querySelector(".p_size").value;
        const cls = g.querySelector(".p_class").value;
        
        const p_od = PIPE_DATA["NPS"][size];
        const f_od = FLANGE_RATINGS[cls] ? FLANGE_RATINGS[cls][size] : undefined;

        // Guard Clause
        if (f_od === undefined) {
            alert(`EXPORT FAILED\n\nData missing for Pipe ${i + 1}: [NPS: ${size} - Class: ${cls}]\n\nPlease select a valid Flange Class or Size.`);
            return;
        }

        const p_ins = parseInt(g.querySelector(".p_ins").value) || 0;
        const f_ins = parseInt(g.querySelector(".f_ins").value) || 0;
        const isBopEnabled = g.querySelector(".bop_check").checked;
        const bopVal = isBopEnabled ? (parseInt(g.querySelector(".bop_val").value) || 0) : 0;

        // --- Calculate "Forward" C2C (Distance to Next Pipe) ---
        let nextC2C = null;
        
        // If there is a next pipe, calculate distance to it
        if (i < groups.length - 1) {
            const nextG = groups[i+1];
            const p2_size = nextG.querySelector(".p_size").value;
            const p2_cls = nextG.querySelector(".p_class").value;
            
            const p2_od = PIPE_DATA["NPS"][p2_size];
            const f2_od = FLANGE_RATINGS[p2_cls][p2_size]; // We know this is safe if guard clause passes later, but for now we trust logic
            const p2_ins = parseInt(nextG.querySelector(".p_ins").value) || 0;
            const f2_ins = parseInt(nextG.querySelector(".f_ins").value) || 0;

            if (mode === 'pp') {
                const raw = (p_od / 2) + p_ins + (p2_od / 2) + p2_ins + gap;
                nextC2C = Math.ceil(raw / 5) * 5;
            } else {
                // Current Pipe is 1, Next Pipe is 2
                nextC2C = calculateC2C(p_od, p_ins, f_od, f_ins, p2_od, p2_ins, f2_od, f2_ins, gap);
            }
        }

        pipeConfigs.push({
            name: g.querySelector(".p_name").value || `Pipe ${i+1}`,
            size: size,
            cls: cls,
            p_od: p_od,
            f_od: f_od,
            p_ins: p_ins,
            f_ins: f_ins,
            bop: bopVal,
            nextC2C: nextC2C // Store the forward distance
        });
    }

    PDFGenerator.generate(pipeConfigs, {
        gap: gap,
        mode: mode,
        totalText: totalText
    });
}