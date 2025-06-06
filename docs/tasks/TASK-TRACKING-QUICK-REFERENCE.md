# 🎯 QUICK REFERENCE - TASK TRACKING SYSTEM

**Fecha Creación:** 2025-06-07  
**Uso:** Referencia rápida para LLM en solicitudes de nuevas features  
**Ubicación:** `docs/tasks/`

---

## 📋 NOMENCLATURA RÁPIDA

### **Formato Obligatorio**
```
P{PHASE}-F{FEATURE}_{DESCRIPCION-CLARA}.md
```

### **Ejemplos Válidos**
```
P2-F2_TASK-TRACKER-USER-AUTHENTICATION.md
P2-F3_TASK-TRACKER-ANALYTICS-DASHBOARD.md  
P2-F4_TASK-TRACKER-API-RATE-LIMITING.md
P3-F1_TASK-TRACKER-MOBILE-PWA.md
```

---

## 🗺️ MAPEO DE PHASES

| Phase | Estado | Enfoque | Siguiente Feature ID |
|-------|--------|---------|---------------------|
| **P1** | ✅ COMPLETADO | MVP Base | - |
| **P2** | 🚧 ACTIVO | Features Avanzadas | **P2-F2** |
| **P3** | ⏳ FUTURO | Expansiones | **P3-F1** |

### **Phase P1 (COMPLETADO)**
- `P1-F1` ✅ MVP Infrastructure  
- `P1-F2` ✅ Real Scraping Integration  
- `P1-F3` ✅ Debugging & Fixes  
- `P1-F4` ✅ UI Improvements  
- `P1-F5` ✅ Testing & Production  
- `P1-F6` ✅ Development Mode  

### **Phase P2 (ACTIVO)**
- `P2-F1` ✅ Pagination + Filters + Dark Mode
- `P2-F2` ⏳ **DISPONIBLE** - Authentication System
- `P2-F3` ⏳ **DISPONIBLE** - Analytics Dashboard  
- `P2-F4` ⏳ **DISPONIBLE** - API Improvements
- `P2-F5` ⏳ **DISPONIBLE** - Database Integration

### **Phase P3 (FUTURO)**
- `P3-F1` ⏳ **DISPONIBLE** - Mobile/PWA
- `P3-F2` ⏳ **DISPONIBLE** - AI/ML Features
- `P3-F3` ⏳ **DISPONIBLE** - Microservices

---

## 🎯 TIPOS DE FEATURES COMUNES

| Tipo de Solicitud | Phase Sugerido | Feature ID | Ejemplo Nombre |
|------------------|----------------|------------|----------------|
| **Authentication** | P2 | F2 | `USER-AUTHENTICATION` |
| **Dashboard** | P2 | F3 | `ANALYTICS-DASHBOARD` |
| **API Security** | P2 | F4 | `API-RATE-LIMITING` |
| **Database** | P2 | F5 | `DATABASE-INTEGRATION` |
| **Mobile App** | P3 | F1 | `MOBILE-PWA` |
| **AI Features** | P3 | F2 | `AI-PROXY-OPTIMIZATION` |
| **Microservices** | P3 | F3 | `MICROSERVICE-SPLIT` |

---

## 📝 TEMPLATE RÁPIDO

Para cualquier nueva feature, usar este template:

```markdown
# 🎯 TASK TRACKER - {NOMBRE FEATURE}

**Proyecto:** MVP Proxy Scraper  
**Fecha Inicio:** {FECHA}  
**Estado:** 🚧 EN DESARROLLO  
**Phase ID:** P{X}-F{Y}  

## 📋 RESUMEN EJECUTIVO
- **Objetivo**: [Qué se quiere lograr]
- **Justificación**: [Por qué es necesario]

## 🎯 OBJETIVOS PRINCIPALES
- [ ] Objetivo 1
- [ ] Objetivo 2

## 📝 DESGLOSE DE TAREAS

### **FASE 1: {NOMBRE}** 🚧
#### **Tarea 1.1: {Descripción}** ⏳
- **Estado**: ⏳ Pendiente
- **Estimación**: {tiempo}

## 🧪 TESTING Y VALIDACIÓN
- [ ] Tests implementados

## 📊 MÉTRICAS DE ÉXITO
- **Performance**: [Criterios]
- **Funcionalidad**: [Checklist]
```

---

## ⚡ FLUJO RÁPIDO

1. **Identificar Feature** → Determinar Phase (P2/P3)
2. **Asignar ID** → Usar próximo F{X} disponible  
3. **Crear Archivo** → `P{X}-F{Y}_{NOMBRE}.md`
4. **Usar Template** → Estructura estándar
5. **Actualizar INDEX** → Agregar a tabla correspondiente

---

## 🚨 REGLAS CRÍTICAS

- ✅ **SIEMPRE** usar format `P{X}-F{Y}_{NOMBRE}.md`
- ✅ **SIEMPRE** ubicar en `docs/tasks/`
- ✅ **SIEMPRE** actualizar INDEX después
- ❌ **NUNCA** crear archivos sin Phase ID
- ❌ **NUNCA** usar espacios en nombres de archivo
- ❌ **NUNCA** saltar números de Feature ID

---

**🎯 PRÓXIMO ID DISPONIBLE: P2-F2**
