/**
 * DXF Generator for Pipe Spacing - R12 (AC1009) Compatible
 */
const DXFWriter = {
     generate(pipes, totalSpacing, mode) {
        // 1. R12 Header with Metric/mm Units
        let dxf = `0\nSECTION\n2\nHEADER\n`;
        dxf += `9\n$ACADVER\n1\nAC1009\n`; // DXF Version R12
        dxf += `9\n$MEASUREMENT\n70\n1\n`;  // 0 = English (inches), 1 = Metric
        dxf += `9\n$INSUNITS\n70\n4\n`;     // 4 = Millimeters
        dxf += `9\n$AUNITS\n70\n0\n`;        // Decimal degrees
        dxf += `0\nENDSEC\n`;
        
        // 2. TABLES - Required for Layers and Linetypes
        dxf += `0\nSECTION\n2\nTABLES\n`;
        
        // Linetype Table
        dxf += `0\nTABLE\n2\nLTYPE\n70\n1\n`;
        dxf += `0\nLTYPE\n2\nCENTER\n70\n64\n3\nCenter ____ _ ____ _ ____\n72\n65\n73\n4\n40\n50.0\n49\n30.0\n49\n-5.0\n49\n5.0\n49\n-5.0\n`;
        dxf += `0\nENDTAB\n`;

        // Layer Table
        dxf += this._getLayerTable();
        dxf += `0\nENDSEC\n`;

    // --- Calculate Global Max Height relative to Y=0 ---
    let absoluteMaxY = 0;
    pipes.forEach(p => {
        // Apply BOP if it exists
        const centerY = (p.p_od / 2) + (p.bop || 0);
        
        // Calculate the top-most edge for every possible layer
        const tops = [
            centerY + (p.p_od / 2),           // Top of Pipe
            centerY + (p.p_od / 2 + p.p_ins), // Top of Pipe Insulation
            centerY + (p.f_od / 2),           // Top of Flange
            centerY + (p.f_od / 2 + p.f_ins)  // Top of Flange Insulation
        ];
        
        const localMaxTop = Math.max(...tops);
        if (localMaxTop > absoluteMaxY) absoluteMaxY = localMaxTop;
    });

    const fixedTopY = absoluteMaxY + 100; // 100mm above the absolute tallest point
    // ---------------------------------------------------------

        // 4. ENTITIES Section
        dxf += `0\nSECTION\n2\nENTITIES\n`;

        // Common Bottom Line
        dxf += this._line(0, 0, totalSpacing, 0, "PIPE");

        let currentX = 0;
        pipes.forEach((p, index) => {
            // Calculate X position
            if (index === 0) {
                currentX = p.p_od / 2;
            } else {
                currentX += p.c2c_to_prev;
            }

            // Apply BOP to Center Y
            const centerY = (p.p_od / 2) + (p.bop || 0);

            // Concentric Circles
            dxf += this._circle(currentX, centerY, p.p_od / 2, "PIPE");
            // --- Add 2 Arcs for Pipe Symbol ---
            const arcRad = p.p_od / 4;
            
            // Arc 1: Center = Pcenter + OD/4. Angles 90 to 270
            dxf += this._arc(currentX, centerY + arcRad, arcRad, 90, 270, "PIPE");
            
            // Arc 2: Center = Pcenter - OD/4. Angles 270 to 90
            dxf += this._arc(currentX, centerY - arcRad, arcRad, 270, 90, "PIPE");
            // ---------------------------------------
            if (p.p_ins > 0) {
                dxf += this._circle(currentX, centerY, (p.p_od / 2) + p.p_ins, "PIPE_INSUL");
            }

            if (mode !== 'pp') {
                dxf += this._circle(currentX, centerY, p.f_od / 2, "FLANGE");

                if (p.f_ins > 0) {
                    dxf += this._circle(currentX, centerY, (p.f_od / 2) + p.f_ins, "FLANGE_INSUL");
                }
            }

            // Centerline using fixedTopY
            dxf += this._line(currentX, centerY, currentX, fixedTopY, "CENTERLINE");

            // Text Label using fixedTopY
            dxf += this._text(currentX, fixedTopY, p.name, 90, "TEXT");
        });

        dxf += `0\nENDSEC\n0\nEOF`;
        return dxf;
    },
    _line(x1, y1, x2, y2, layer) {
        // R12 Lines use codes 10,20,30 (start) and 11,21,31 (end)
        return `0\nLINE\n8\n${layer}\n10\n${x1.toFixed(3)}\n20\n${y1.toFixed(3)}\n30\n0.0\n11\n${x2.toFixed(3)}\n21\n${y2.toFixed(3)}\n31\n0.0\n`;
    },

    _circle(x, y, rad, layer) {
        if (rad <= 0) return "";
        return `0\nCIRCLE\n8\n${layer}\n10\n${x.toFixed(3)}\n20\n${y.toFixed(3)}\n30\n0.0\n40\n${rad.toFixed(3)}\n`;
    },
    
    _arc(x, y, rad, start, end, layer) {
        // R12 Arc: 10,20=center, 40=radius, 50=start angle, 51=end angle
        return `0\nARC\n8\n${layer}\n10\n${x.toFixed(3)}\n20\n${y.toFixed(3)}\n30\n0.0\n40\n${rad.toFixed(3)}\n50\n${start}\n51\n${end}\n`;
    },

    _text(x, y, val, rot, layer) {
        // R12 Text: 10,20=pos, 40=height, 1=value, 50=rotation
        return `0\nTEXT\n8\n${layer}\n10\n${x.toFixed(3)}\n20\n${y.toFixed(3)}\n30\n0.0\n40\n15.0\n1\n${val}\n50\n${rot}\n`;
    },
    

    _getLayerTable() {
        const layers = [
            { name: "PIPE", color: 7, ltype: "CONTINUOUS" },
            { name: "PIPE_INSUL", color: 3, ltype: "CONTINUOUS" },
            { name: "FLANGE", color: 2, ltype: "CONTINUOUS" },
            { name: "FLANGE_INSUL", color: 4, ltype: "CONTINUOUS" },
            { name: "TEXT", color: 7, ltype: "CONTINUOUS" },
            { name: "CENTERLINE", color: 1, ltype: "CENTER" }
        ];
        let table = `0\nTABLE\n2\nLAYER\n70\n${layers.length}\n`;
        layers.forEach(l => {
            // R12 Layer flags (70) usually 64 for "standard"
            table += `0\nLAYER\n2\n${l.name}\n70\n64\n62\n${l.color}\n6\n${l.ltype}\n`;
        });
        return table + `0\nENDTAB\n`;
    }
};