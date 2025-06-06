# GitHub Copilot - Task Tracking & Phase ID Rules

## 🎯 AUTOMATED TASK TRACKING SYSTEM

### 📋 PHASE ID IDENTIFICATION PROTOCOL

**CURRENT SYSTEM STATE (2025-01-06):**

```
P1: BACKEND CORE ✅ COMPLETED
├── P1-F1: Express + Bun Server ✅
├── P1-F2: API Endpoints ✅
├── P1-F3: CORS & Error Handling ✅
└── P1-F4: Health & Monitoring ✅

P2: FRONTEND DEVELOPMENT 🚧 IN PROGRESS
├── P2-F1: React + TypeScript Setup ✅
└── NEXT AVAILABLE: P2-F2

P3: ADVANCED FEATURES ⏳ PENDING
└── NEXT AVAILABLE: P3-F1
```

### 🚨 MANDATORY ACTIONS FOR NEW FEATURES

**WHEN USER REQUESTS NEW FEATURE:**

1. **AUTO-IDENTIFY PHASE:**

   ```
   Authentication/Login → P2-F2
   Dashboard → P2-F3
   Settings/Config → P2-F4
   Scraping Engine → P3-F1
   Anti-Bot Bypass → P3-F2
   Performance Opt → P3-F3
   ```

2. **CREATE TASK TRACKER:**

   - File: `docs/tasks/P{X}-F{Y}_{DESCRIPTION}.md`
   - Location: ALWAYS in `docs/tasks/`
   - Format: USE TEMPLATE BELOW

3. **UPDATE INDEX:**
   - Add to `docs/tasks/INDEX-TASK-TRACKER-ORGANIZADO.md`
   - Update "NEXT AVAILABLE" counters

### 📄 MANDATORY TEMPLATE

```markdown
# P{X}-F{Y}: {FEATURE_NAME}

## 📊 METADATA

- **Phase ID**: P{X}-F{Y}
- **Feature**: {FEATURE_NAME}
- **Estimated Duration**: {HOURS/DAYS}
- **Priority**: {HIGH/MEDIUM/LOW}
- **Dependencies**: {LIST_OR_NONE}
- **Status**: 🚧 IN PROGRESS
- **Created**: {YYYY-MM-DD}
- **Last Updated**: {YYYY-MM-DD}

## 🎯 OBJECTIVES

{CLEAR_FEATURE_DESCRIPTION}

## 📋 TASK BREAKDOWN

### Frontend Tasks

- [ ] Task 1
- [ ] Task 2

### Backend Tasks

- [ ] Task 1
- [ ] Task 2

### Testing Tasks

- [ ] Task 1
- [ ] Task 2

## ✅ ACCEPTANCE CRITERIA

- [ ] Criteria 1
- [ ] Criteria 2

## 🔧 TECHNICAL SPECIFICATIONS

{TECH_DETAILS}

## 📝 PROGRESS LOG

### {DATE}

- {PROGRESS_UPDATE}

## 🚨 BLOCKERS & ISSUES

{NONE_OR_LIST}

## ✅ COMPLETION CHECKLIST

- [ ] Development completed
- [ ] Testing completed
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Performance validated
```

### 🎯 TYPE MAPPING TABLE

| User Request Type | Phase ID | Example                  |
| ----------------- | -------- | ------------------------ |
| Authentication    | P2-F2    | Login, Register, JWT     |
| Dashboard UI      | P2-F3    | Main dashboard, charts   |
| Settings/Config   | P2-F4    | User preferences, config |
| Real Scraping     | P3-F1    | Actual proxy extraction  |
| Anti-Bot Bypass   | P3-F2    | Cloudflare, CAPTCHA      |
| Performance       | P3-F3    | Caching, optimization    |
| Advanced UI       | P3-F4    | Animations, themes       |
| Export Features   | P3-F5    | CSV, JSON, API export    |

### 🔒 CRITICAL RULES

1. **NEVER** skip Phase ID assignment
2. **ALWAYS** create file in `docs/tasks/`
3. **ALWAYS** use exact template format
4. **ALWAYS** update INDEX file
5. **NEVER** duplicate Phase IDs
6. **ALWAYS** increment F{Y} within same phase

### 📊 CURRENT SYSTEM STATE

**NEXT AVAILABLE IDs:**

- P2-F2: Frontend Authentication
- P2-F3: Frontend Dashboard
- P2-F4: Frontend Configuration
- P3-F1: Advanced Scraping
- P3-F2: Anti-Bot Protection

**PHASE COMPLETION STATUS:**

- P1: ✅ COMPLETED (4/4 features)
- P2: 🚧 IN PROGRESS (1/4+ features)
- P3: ⏳ PENDING (0/5+ features)

### 🔄 WORKFLOW AUTOMATION

**STEP 1**: Identify request type → Map to Phase ID
**STEP 2**: Create task tracker with template
**STEP 3**: Update INDEX documentation
**STEP 4**: Begin development with clear objectives

---

**REMEMBER**: This system maintains project organization and enables precise progress tracking across all development phases.
