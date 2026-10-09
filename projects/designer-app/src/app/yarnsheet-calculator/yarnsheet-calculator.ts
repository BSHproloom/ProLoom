import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProjectService, Project, Carpet, CarpetService } from 'shared-core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-yarnsheet-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, MatButtonModule, MatIconModule],
  templateUrl: './yarnsheet-calculator.html',
  styleUrls: ['./yarnsheet-calculator.css']
})
export class YarnsheetCalculator implements OnInit {
  projects: Project[] = [];
  allCarpets: Carpet[] = [];
  
  masterForm!: FormGroup;
  isSubmitting = false;

  newColorForms: FormGroup[] = [];

  private fb = inject(FormBuilder);
  private projectService = inject(ProjectService);
  private carpetService = inject(CarpetService);
  private cdr = inject(ChangeDetectorRef);

  activeTab = 'queue'; // 'queue' | 'active' | 'saved' | 'settings'
  projectName = '';
  savedProjects: any[] = [];
  tasksNeedingYarn: any[] = [];
  currentDesigner: any = null;

  weightSettings: any = {
    'HT 550': { 'Wool': 3.5, 'Silk': 6.5, 'Acrylic': 6.5, 'Roya': 6.5, 'Silkana': 6.5 },
    'HT 650': { 'Wool': 4.2, 'Silk': 7.0, 'Acrylic': 7.0, 'Roya': 7.0, 'Silkana': 7.0 },
    'HT 750': { 'Wool': 5.0, 'Silk': 7.5, 'Acrylic': 7.5, 'Roya': 7.5, 'Silkana': 7.5 },
    'HT 850': { 'Wool': 5.5, 'Silk': 8.0, 'Acrylic': 8.0, 'Roya': 8.0, 'Silkana': 8.0 },
  };
  qualities = ['HT 550', 'HT 650', 'HT 750', 'HT 850'];
  materials = ['Wool', 'Silk', 'Acrylic', 'Roya', 'Silkana'];

  duplicatePreviousColors = false;

  ngOnInit() {
    const ls = localStorage.getItem('current_designer');
    if (ls) {
      try {
        this.currentDesigner = JSON.parse(ls);
      } catch (e) {}
    }

    this.masterForm = this.fb.group({
      project_name: ['', Validators.required],
      carpets: this.fb.array([])
    });

    this.projectService.getProjects().subscribe(projects => {
      this.projects = projects;
      this.loadTasksNeedingYarn();
    });

    this.loadSavedProjects();
    this.loadSettings();
  }

  loadTasksNeedingYarn() {
    if (!this.currentDesigner) return;
    this.carpetService.getCarpetsForDesigner(this.currentDesigner.name).subscribe(carpets => {
      const workingStatuses = ['Assigned', 'In Progress', 'Revision Needed', 'Revision Requested', 'Prod File Revision Needed'];
      const filtered = carpets.filter(c => 
        !workingStatuses.includes(c.status) && 
        c.yarn_sheet_updated !== true &&
        c.type_of_work !== 'Sample'
      );
      
      const grouped: any = {};
      filtered.forEach(c => {
        if (!grouped[c.project_fk]) {
          const p = this.projects.find(proj => proj.id === c.project_fk);
          grouped[c.project_fk] = { project: p, carpets: [] };
        }
        grouped[c.project_fk].carpets.push(c);
      });
      
      this.tasksNeedingYarn = Object.values(grouped);
      this.cdr.detectChanges();
    });
  }

  prepareYarnSheet(carpets: any[], project: any) {
    this.activeTab = 'active';
    this.masterForm.patchValue({ project_name: project?.name || project?.project_name || carpets[0]?.project_fk });
    
    while (this.carpetsFormArray.length !== 0) {
      this.carpetsFormArray.removeAt(0);
    }
    this.newColorForms = [];

    carpets.forEach(carpet => {
      const cGroup = this.fb.group({
        carpet_name: [carpet.composite_item_name, Validators.required],
        qty: [carpet.no_of_rugs || carpet.quantity || 1, [Validators.required, Validators.min(1)]],
        shape: [carpet.shape || 'Square/Rectangle'],
        width: [carpet.width || null],
        length: [carpet.height || carpet.length || null],
        diameter: [carpet.diameter || null],
        quality: [carpet.quality || 'HT 550'],
        colors: this.fb.array([]),
        carpet_id: [carpet.id]
      });

      this.carpetsFormArray.push(cGroup);
      this.newColorForms.push(this.fb.group({
        color: ['', Validators.required],
        percentage: [null, [Validators.required, Validators.min(0.1), Validators.max(100)]],
        material: ['Wool', Validators.required],
        stock_in_hand: [''],
        lot_no: [[]]
      }));
    });
  }

  loadSettings() {
    const savedSettings = localStorage.getItem('yarn_settings');
    if (savedSettings) {
      this.weightSettings = JSON.parse(savedSettings);
    }
  }

  saveSettings() {
    localStorage.setItem('yarn_settings', JSON.stringify(this.weightSettings));
    alert('Settings saved successfully!');
  }

  loadSavedProjects() {
    const saved = localStorage.getItem('yarn_projects');
    if (saved) {
      this.savedProjects = JSON.parse(saved);
    }
  }

  get carpetsFormArray() {
    return this.masterForm.get('carpets') as FormArray;
  }

  getColorsFormArray(carpetIndex: number): FormArray {
    return this.carpetsFormArray.at(carpetIndex).get('colors') as FormArray;
  }

  addCarpet() {
    const cGroup = this.fb.group({
      carpet_name: ['', Validators.required],
      qty: [1, [Validators.required, Validators.min(1)]],
      shape: ['Square/Rectangle'],
      width: [null],
      length: [null],
      diameter: [null],
      quality: ['HT 550'],
      colors: this.fb.array([]),
      carpet_id: [null]
    });
    
    if (this.carpetsFormArray.length > 0 && this.duplicatePreviousColors) {
      const prevCarpetIndex = this.carpetsFormArray.length - 1;
      const prevColors = this.getColorsFormArray(prevCarpetIndex).value;
      const newColorsArr = cGroup.get('colors') as FormArray;
      
      prevColors.forEach((v: any) => {
        newColorsArr.push(this.fb.group({
          color: [v.color, Validators.required],
          percentage: [v.percentage, [Validators.required, Validators.min(0.1), Validators.max(100)]],
          material: [v.material, Validators.required],
          stock_in_hand: [v.stock_in_hand || ''],
          lot_no: [v.lot_no || []]
        }));
      });
    }
    
    this.carpetsFormArray.push(cGroup);
    
    this.newColorForms.push(this.fb.group({
      color: ['', Validators.required],
      percentage: [null, [Validators.required, Validators.min(0.1), Validators.max(100)]],
      material: ['Wool', Validators.required],
      stock_in_hand: [''],
      lot_no: [[]]
    }));
  }

  removeCarpet(index: number) {
    this.carpetsFormArray.removeAt(index);
    this.newColorForms.splice(index, 1);
  }

  addColorToCarpet(carpetIndex: number) {
    const addForm = this.newColorForms[carpetIndex];
    if (addForm.invalid) return;

    const v = addForm.value;
    const colorsArr = this.getColorsFormArray(carpetIndex);
    
    // Validate unique color + material combination
    const exists = colorsArr.value.some((c: any) => c.color.toLowerCase() === v.color.toLowerCase() && c.material === v.material);
    if (exists) {
      alert(`Color code "${v.color}" with material "${v.material}" already exists in this carpet!`);
      return;
    }
    
    colorsArr.push(this.fb.group({
      color: [v.color, Validators.required],
      percentage: [v.percentage, [Validators.required, Validators.min(0.1), Validators.max(100)]],
      material: [v.material, Validators.required],
      stock_in_hand: [''],
      lot_no: [[]]
    }));

    addForm.patchValue({
      color: '',
      percentage: null,
      stock_in_hand: '',
      lot_no: []
    });

    this.sortColors(carpetIndex);
  }

  sortColors(carpetIndex: number) {
    const colorsArr = this.getColorsFormArray(carpetIndex);
    const materialOrder: any = { 'Wool': 1, 'Silk': 2, 'Acrylic': 3, 'Roya': 4, 'Silkana': 5 };
    
    colorsArr.controls.sort((a, b) => {
      const matA = a.get('material')?.value;
      const matB = b.get('material')?.value;
      const orderA = materialOrder[matA] || 99;
      const orderB = materialOrder[matB] || 99;
      
      if (orderA !== orderB) return orderA - orderB;
      
      const colA = a.get('color')?.value || '';
      const colB = b.get('color')?.value || '';
      return colA.localeCompare(colB);
    });
    
    colorsArr.updateValueAndValidity();
  }

  hasColorsWithMaterial(carpetIndex: number, material: string): boolean {
    return this.getColorCountByMaterial(carpetIndex, material) > 0;
  }

  getColorCountByMaterial(carpetIndex: number, material: string): number {
    const colorsArr = this.getColorsFormArray(carpetIndex);
    let count = 0;
    for (let i = 0; i < colorsArr.length; i++) {
      if (colorsArr.at(i).get('material')?.value === material) {
        count++;
      }
    }
    return count;
  }

  removeColorFromCarpet(carpetIndex: number, colorIndex: number) {
    this.getColorsFormArray(carpetIndex).removeAt(colorIndex);
  }

  getCalculatedArea(carpetGroup: FormGroup): number {
    const shape = carpetGroup.get('shape')?.value;
    let area = 0;
    if (shape === 'Square/Rectangle') {
      const w = carpetGroup.get('width')?.value || 0;
      const l = carpetGroup.get('length')?.value || 0;
      area = w * l;
    } else if (shape === 'Circle') {
      const d = carpetGroup.get('diameter')?.value || 0;
      const r = d / 2;
      area = Math.PI * r * r;
    } else if (shape === 'Oval') {
      const w = carpetGroup.get('width')?.value || 0;
      const l = carpetGroup.get('length')?.value || 0;
      area = Math.PI * (w / 2) * (l / 2);
    }
    return area;
  }

  getTotalPercentage(carpetIndex: number): number {
    let total = 0;
    const colors = this.getColorsFormArray(carpetIndex).value || [];
    colors.forEach((c: any) => {
      total += (c.percentage || 0);
    });
    return Number(total.toFixed(2));
  }

  getKgForColor(carpetIndex: number, colorIndex: number): number {
    const carpetGroup = this.carpetsFormArray.at(carpetIndex) as FormGroup;
    const colorGroup = this.getColorsFormArray(carpetIndex).at(colorIndex) as FormGroup;
    
    const area = this.getCalculatedArea(carpetGroup);
    const quality = carpetGroup.get('quality')?.value;
    const material = colorGroup.get('material')?.value;
    const percentage = colorGroup.get('percentage')?.value || 0;
    const qty = carpetGroup.get('qty')?.value || 1;

    if (area > 0 && quality && material) {
      const rate = this.weightSettings[quality]?.[material] || 0;
      return area * rate * (percentage / 100) * qty;
    }
    return 0;
  }

  getYarnToOrder(carpetIndex: number, colorIndex: number): number {
    const requiredKg = this.getKgForColor(carpetIndex, colorIndex);
    const colorGroup = this.getColorsFormArray(carpetIndex).at(colorIndex) as FormGroup;
    let stock = parseFloat(colorGroup.get('stock_in_hand')?.value);
    if (isNaN(stock)) stock = 0;
    
    const toOrder = requiredKg - stock;
    return toOrder > 0 ? Number(toOrder.toFixed(2)) : 0;
  }

  getTotalKgForCarpet(carpetIndex: number): number {
    let total = 0;
    const colorsCount = this.getColorsFormArray(carpetIndex).length;
    for (let i = 0; i < colorsCount; i++) {
      total += this.getKgForColor(carpetIndex, i);
    }
    return Number(total.toFixed(2));
  }

  getSummaryMap(): Map<string, { material: string, totalKg: number }> {
    const summaryMap = new Map<string, { material: string, totalKg: number }>();
    
    for (let c = 0; c < this.carpetsFormArray.length; c++) {
      const colorsArr = this.getColorsFormArray(c);
      for (let i = 0; i < colorsArr.length; i++) {
        const cg = colorsArr.at(i);
        const code = cg.get('color')?.value;
        const mat = cg.get('material')?.value;
        const kg = this.getKgForColor(c, i);

        if (code && kg > 0) {
          const key = `${mat}-${code}`;
          if (summaryMap.has(key)) {
            summaryMap.get(key)!.totalKg += kg;
          } else {
            summaryMap.set(key, { material: mat, totalKg: kg });
          }
        }
      }
    }
    return summaryMap;
  }

  getSummaryArray(): { code: string, material: string, totalKg: number }[] {
    const map = this.getSummaryMap();
    const arr = [];
    for (const [key, val] of map.entries()) {
      const code = key.split('-')[1];
      arr.push({ code, material: val.material, totalKg: val.totalKg });
    }
    arr.sort((a, b) => {
      if (a.material !== b.material) return a.material.localeCompare(b.material);
      return a.code.localeCompare(b.code);
    });
    return arr;
  }

  getProjectTotalKg(): number {
    let sum = 0;
    const arr = this.getSummaryArray();
    arr.forEach(item => sum += item.totalKg);
    return Number(sum.toFixed(2));
  }

  async saveProjectToLocal() {
    if (this.masterForm.invalid) {
      alert('Please fill out all required fields properly.');
      return;
    }
    
    for (let c = 0; c < this.carpetsFormArray.length; c++) {
      const totalP = this.getTotalPercentage(c);
      if (totalP !== 100) {
        const carpetName = this.carpetsFormArray.at(c).get('carpet_name')?.value;
        alert(`Carpet "${carpetName}" must have exactly 100% color coverage. Currently it is ${totalP}%.`);
        return;
      }
    }
    
    this.isSubmitting = true;
    const payload = this.masterForm.getRawValue();
    const project = {
      id: Date.now().toString(),
      name: payload.project_name,
      date: new Date().toISOString(),
      data: payload
    };
    
    const existingIndex = this.savedProjects.findIndex(p => p.name === project.name);
    if (existingIndex > -1) {
      this.savedProjects[existingIndex] = project;
    } else {
      this.savedProjects.push(project);
    }
    
    localStorage.setItem('yarn_projects', JSON.stringify(this.savedProjects));

    // Update DB to mark carpets as having yarn sheet completed
    for (let c = 0; c < this.carpetsFormArray.length; c++) {
      const carpetId = this.carpetsFormArray.at(c).get('carpet_id')?.value;
      if (carpetId) {
        try {
          await this.carpetService.updateCarpet(carpetId, { yarn_sheet_updated: true });
        } catch(e) {
          console.error('Failed to update carpet yarn sheet status', e);
        }
      }
    }
    
    this.isSubmitting = false;
    alert(`Project "${project.name}" saved successfully!`);
    this.activeTab = 'queue';
  }

  openProject(project: any) {
    this.masterForm.get('project_name')?.setValue(project.name);
    
    while (this.carpetsFormArray.length) {
      this.carpetsFormArray.removeAt(0);
    }
    this.newColorForms = [];
    
    project.data.carpets.forEach((cData: any) => {
      const cGroup = this.fb.group({
        carpet_name: [cData.carpet_name, Validators.required],
        qty: [cData.qty || 1, [Validators.required, Validators.min(1)]],
        shape: [cData.shape],
        width: [cData.width],
        length: [cData.length],
        diameter: [cData.diameter],
        quality: [cData.quality],
        colors: this.fb.array([])
      });
      
      const newColorsArr = cGroup.get('colors') as FormArray;
      if (cData.colors) {
        cData.colors.forEach((v: any) => {
          newColorsArr.push(this.fb.group({
            color: [v.color, Validators.required],
            percentage: [v.percentage, [Validators.required, Validators.min(0.1), Validators.max(100)]],
            material: [v.material, Validators.required],
            stock_in_hand: [v.stock_in_hand || ''],
            lot_no: [v.lot_no || '']
          }));
        });
      }
      this.carpetsFormArray.push(cGroup);
      this.newColorForms.push(this.fb.group({
        color: ['', Validators.required],
        percentage: [null, [Validators.required, Validators.min(0.1), Validators.max(100)]],
        material: ['Wool', Validators.required],
        stock_in_hand: [''],
        lot_no: ['']
      }));
    });
    
    this.activeTab = 'active';
  }

  deleteProject(index: number) {
    if(confirm('Are you sure you want to delete this project?')) {
      this.savedProjects.splice(index, 1);
      localStorage.setItem('yarn_projects', JSON.stringify(this.savedProjects));
    }
  }

  getLotTags(val: any): string[] {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return String(val).split(' ').filter(v => v.trim() !== '');
  }

  addLotTag(event: any, colorGroup: FormGroup) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    if (value) {
      const currentTags = this.getLotTags(colorGroup.get('lot_no')?.value);
      if (!currentTags.includes(value)) {
        currentTags.push(value);
        colorGroup.get('lot_no')?.setValue(currentTags);
      }
      input.value = '';
    }
    event.preventDefault();
  }

  removeLotTag(colorGroup: FormGroup, tagToRemove: string) {
    const currentTags = this.getLotTags(colorGroup.get('lot_no')?.value);
    const newTags = currentTags.filter(t => t !== tagToRemove);
    colorGroup.get('lot_no')?.setValue(newTags);
  }

  getMaterialGroups(carpetIndex: number): { material: string, count: number, startIndex: number }[] {
    const colors = this.getColorsFormArray(carpetIndex).value || [];
    const groups: { material: string, count: number, startIndex: number }[] = [];
    
    if (colors.length === 0) return groups;
    
    let currentMaterial = colors[0].material;
    let currentCount = 1;
    let currentStart = 0;
    
    for (let i = 1; i < colors.length; i++) {
      if (colors[i].material === currentMaterial) {
        currentCount++;
      } else {
        groups.push({ material: currentMaterial, count: currentCount, startIndex: currentStart });
        currentMaterial = colors[i].material;
        currentCount = 1;
        currentStart = i;
      }
    }
    groups.push({ material: currentMaterial, count: currentCount, startIndex: currentStart });
    
    return groups;
  }

  async exportExcel() {
    try {
      const ExcelJSModule = await import('exceljs');
      const ExcelJS = ExcelJSModule.default || ExcelJSModule;
      // @ts-ignore
      const fileSaver = await import('file-saver');
      const saveAs = fileSaver.saveAs || (fileSaver as any).default?.saveAs || (fileSaver as any).default || (fileSaver as any);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('YarnSheet');

      // 1. Fetch Project Details to get Sales Order
      let salesOrder = '';
      const projectName = this.masterForm.get('project_name')?.value;
      const project = this.projects.find(p => p.project_name === projectName);
      if (project) {
        salesOrder = project.sales_order || '';
      }

      // Add Headers
      const r1 = worksheet.addRow(['Project ID : ' + (project?.id || '')]);
      worksheet.mergeCells(1, 1, 1, 8);
      const r2 = worksheet.addRow(['Sales Order No. : ' + salesOrder]);
      worksheet.mergeCells(2, 1, 2, 8);
      const todayDate = new Date().toLocaleDateString('en-GB');
      const r3 = worksheet.addRow(['Date : ' + todayDate]);
      worksheet.mergeCells(3, 1, 3, 8);
      worksheet.addRow([]); // Empty row 4

      [r1, r2, r3].forEach(r => {
        r.getCell(1).font = { bold: true, size: 11, name: 'Calibri' };
      });

      let maxCols = 8;
      let currentRow = 5;

      const carpets = this.carpetsFormArray.controls;
      
      const palette = ['FFE2EFDA', 'FFFCE4D6', 'FFD9E1F2', 'FFFFF2CC', 'FFEEDEDE'];
      const materialColors: { [key: string]: string } = {};
      let colorIndex = 0;

      for (let c = 0; c < carpets.length; c++) {
        const carpetGroup = carpets[c] as FormGroup;
        const colors = this.getColorsFormArray(c).controls as FormGroup[];
        const matGroups = this.getMaterialGroups(c);
        
        const materialsMap: { [key: string]: string } = {
          'Wool': 'Nz Wool',
          'Silk': 'Bamboo Silk',
          'Acrylic': 'Acrylic',
          'Roya': 'Roya',
          'Silkana': 'Silkana'
        };

        const totalCols = 3 + colors.length; // CARPET DESCR, QUALITY, AREA + colors
        if (totalCols > maxCols) maxCols = totalCols;

        const startRow = currentRow;
        const merges: any[] = [];
        
        // Row 1: Material Headers
        const hr1 = worksheet.addRow([]);
        hr1.getCell(1).value = 'CARPET DESCRIPTION';
        hr1.getCell(2).value = 'QUALITY';
        hr1.getCell(3).value = 'AREA';
        hr1.height = 15;
        
        // Row 2: Color Codes
        const hr2 = worksheet.addRow([]);
        const carpetName = carpetGroup.get('carpet_name')?.value;
        hr2.getCell(1).value = carpetName || '';
        merges.push([startRow + 1, 1, startRow + 2, 1]); // Merge SKU down
        
        hr2.getCell(2).value = carpetGroup.get('quality')?.value;
        const area = this.getCalculatedArea(carpetGroup);
        hr2.getCell(3).value = area || 0;
        hr2.height = 15;
        
        let currentCol = 4;
        matGroups.forEach(mg => {
           const span = mg.count;
           if (span > 1) {
              merges.push([startRow, currentCol, startRow, currentCol + span - 1]);
           }
           const mappedMat = materialsMap[mg.material] || mg.material;
           hr1.getCell(currentCol).value = mappedMat;
           
           if (!materialColors[mappedMat]) {
              materialColors[mappedMat] = palette[colorIndex % palette.length];
              colorIndex++;
           }
           const fillColor = materialColors[mappedMat];
           
           for (let i = 0; i < span; i++) {
              hr2.getCell(currentCol + i).value = colors[mg.startIndex + i].get('color')?.value;
              hr1.getCell(currentCol + i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
              hr2.getCell(currentCol + i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
           }
           currentCol += span;
        });

        // Row 3: Actual Quantity
        const aqRow = worksheet.addRow([]);
        merges.push([startRow + 2, 2, startRow + 2, 3]);
        aqRow.getCell(2).value = 'Actual Quantity';
        aqRow.height = 15;
        
        colors.forEach((cg, colIndex) => {
          const kg = this.getKgForColor(c, colIndex);
          aqRow.getCell(4 + colIndex).value = kg;
        });
        
        // Row 4: Totals
        const tRow = worksheet.addRow([]);
        merges.push([startRow + 3, 2, startRow + 3, 3]);
        tRow.getCell(2).value = 'Total';
        
        colors.forEach((cg, colIndex) => {
          const kg = this.getKgForColor(c, colIndex);
          tRow.getCell(4 + colIndex).value = Math.round(kg);
        });
        tRow.height = 15.75;

        // Row 5: Stock In Hand
        const sRow = worksheet.addRow([]);
        merges.push([startRow + 4, 1, startRow + 4, 3]);
        sRow.getCell(1).value = 'Stock In Hand';
        colors.forEach((cg, colIndex) => {
          sRow.getCell(4 + colIndex).value = cg.get('stock_in_hand')?.value || null;
        });

        // Row 6: Lot No
        const lRow = worksheet.addRow([]);
        merges.push([startRow + 5, 1, startRow + 5, 3]);
        lRow.getCell(1).value = 'Lot No';
        colors.forEach((cg, colIndex) => {
          const tags = this.getLotTags(cg.get('lot_no')?.value);
          lRow.getCell(4 + colIndex).value = tags.length ? tags.join(' + ') : null;
        });
        // Let Excel auto-fit the height based on wrapText

        // Row 7: Yarn To Order
        const yRow = worksheet.addRow([]);
        merges.push([startRow + 6, 1, startRow + 6, 3]);
        yRow.getCell(1).value = 'Yarn To Order';
        colors.forEach((cg, colIndex) => {
          const order = this.getYarnToOrder(c, colIndex);
          yRow.getCell(4 + colIndex).value = order > 0 ? order : null;
        });

        worksheet.addRow([]); // Blank row between carpets
        
        // Apply Styling to this block BEFORE merging (so exterior borders work, then merge overrides interiors)
        const blockRows = [hr1, hr2, aqRow, tRow, sRow, lRow, yRow];
        const greyFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
        
        blockRows.forEach((r, rIdx) => {
          for (let i = 1; i <= totalCols; i++) {
             const cell = r.getCell(i);
             
             // Medium borders on perimeter, thin inside
             const borderTop = rIdx === 0 ? 'medium' : 'thin';
             const borderBottom = rIdx === 6 ? 'medium' : 'thin';
             const borderLeft = i === 1 ? 'medium' : 'thin';
             const borderRight = i === totalCols ? 'medium' : 'thin';
             
             cell.border = { 
                top: { style: borderTop as any, color: { argb: 'FF000000' } }, 
                left: { style: borderLeft as any, color: { argb: 'FF000000' } }, 
                bottom: { style: borderBottom as any, color: { argb: 'FF000000' } }, 
                right: { style: borderRight as any, color: { argb: 'FF000000' } } 
             };
             
             cell.alignment = { horizontal: 'center', vertical: 'middle' };
             cell.font = { size: 11, name: 'Calibri' };
             
             if (rIdx === 0) {
                if (i === 1) cell.alignment = { horizontal: 'left', vertical: 'middle' };
             } else if (rIdx === 1) { // hr2
                if (i === 1) { cell.alignment = { horizontal: 'left', vertical: 'top' }; cell.font = { bold: true, size: 11, name: 'Calibri' }; }
                if (i === 2 || i === 3) { cell.font = { bold: true, size: 11, name: 'Calibri' }; }
                if (i >= 4) { cell.font = { bold: true, size: 11, name: 'Calibri' }; } // bold colors
             } else if (rIdx === 2) { // aqRow
                if (i === 1) { cell.alignment = { horizontal: 'left', vertical: 'top' }; cell.font = { bold: true, size: 11, name: 'Calibri' }; }
                if (i === 2) cell.alignment = { horizontal: 'right', vertical: 'middle' };
             } else if (rIdx === 3) { // tRow
                if (i === 2) cell.alignment = { horizontal: 'right', vertical: 'middle' };
                if (i >= 4) { cell.font = { bold: true, size: 12, name: 'Calibri' }; }
             } else if (rIdx === 4 || rIdx === 5 || rIdx === 6) {
                if (i >= 4) { cell.alignment = { horizontal: 'right', vertical: 'middle' }; }
                
                if (rIdx === 4 || rIdx === 5) {
                   cell.fill = greyFill as any;
                }
                
                if (rIdx === 5 && i >= 4) {
                   cell.alignment = { wrapText: true, horizontal: 'right', vertical: 'middle' };
                }
                
                if (rIdx === 6 && i >= 4 && cell.value) {
                   cell.font = { bold: true, color: { argb: 'FFFF0000' }, size: 11, name: 'Calibri' };
                   cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
             }
          }
        });

        // Apply merges AFTER borders so exceljs properly handles merged cells!
        merges.forEach(m => worksheet.mergeCells(m[0], m[1], m[2], m[3]));
        
        currentRow += 8;
      }

      for (let i = 1; i <= maxCols; i++) {
        let width = 11.4;
        if (i === 1) width = 21.3;
        else if (i === 2) width = 10.7;
        else if (i === 3) width = 8.9;
        
        worksheet.getColumn(i).width = width;
      }

      worksheet.addRow([]);
      worksheet.addRow([]);
      
      const sigRowNum = currentRow + 2;
      const sigRow = worksheet.addRow([]);
      sigRow.getCell(2).value = 'Prepared By                                              (Designer Name)';
      
      sigRow.getCell(5).value = 'Verified by \nMohammad Ali Nikzad';
      sigRow.getCell(5).alignment = { wrapText: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `YarnSheet_${projectName}_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (e: any) {
      console.error('Error generating Excel file:', e);
      alert('Failed to generate Excel file: ' + (e.message || e));
    }
  }
}
