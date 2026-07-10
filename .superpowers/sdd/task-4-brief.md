### Task 4: Copiar PNGs de footylogos a public/img/

**Files:**
- Create: `frontend/public/img/` (carpeta)
- Copy: `C:\Users\astur\Desktop\liga.paraguaya.futbol\img\*.png` → `frontend/public/img/`

- [ ] **Step 1: Copiar imágenes**

```bash
Copy-Item "C:\Users\astur\Desktop\liga.paraguaya.futbol\img\*.png" -Destination "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend\public\img\"
```

- [ ] **Step 2: Verificar**

```bash
Get-ChildItem "C:\Users\astur\Desktop\liga.paraguaya.futbol\frontend\public\img\"
```

- [ ] **Step 3: Commit**

```bash
git add frontend/public/img/
git commit -m "feat: agregar PNGs de escudos footylogos para sección Significado del Escudo"
```

---

