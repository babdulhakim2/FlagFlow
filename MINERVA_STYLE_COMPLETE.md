# 🚀 FlagFlow - Now with Minerva-Style Entry Flow!

## ✅ Successfully Implemented Minerva's Pattern for AML

### 🎯 **New Intelligent Entry Point**

**Step 1: Initial AML Input**
- User enters: "Wire transfer $50,000 to high-risk jurisdiction"
- Clean, focused input similar to Minerva's scientific queries
- Preset quick action buttons for common scenarios

**Step 2: AI-Generated Context Questions (4 questions)**
→ "What is the customer's stated business activity?"
→ "Is this transaction amount typical for this customer?"
→ "What is the geographic risk profile?"
→ "What documentation was provided for this transfer?"

**Step 3: User Answers Build Context**
→ "Import/Export business"
→ "No, significantly higher than usual"
→ "Destination is high-risk/offshore jurisdiction"
→ "Basic transfer instructions only"

**Step 4: Smart Agent Cascade**
→ Orchestrator analyzes context and intelligently spawns:
  - OSINT Agent (entity concerns detected)
  - Geo Agent (cross-border + high-risk routing)
  - Pattern Agent (unusual amount patterns)

## 🏗️ **Architecture Changes Made**

### Frontend Updates
1. **AMLChatInput.tsx** - Clean input with AML presets
2. **AMLQuestionFlow.tsx** - Context-building question interface
3. **Updated page.tsx** - Three-stage flow (input → questions → investigation)
4. **Enhanced InvestigationCanvas** - Accepts context, shows investigation details

### Backend Intelligence
1. **Question Generation** - Smart AML questions based on query type:
   - Wire transfers → Business activity, amount patterns, geography
   - Cash deposits → Structuring patterns, source of funds
   - Shell companies → Entity documentation, relationships

2. **Context-Driven Agent Spawning** - Agents spawn based on answers:
   - Entity mentions → OSINT agent
   - Geographic concerns → Geo intelligence
   - Pattern indicators → Pattern detector

3. **Redis Learning** - Context patterns stored for future optimization

## 🎯 **Perfect Demo Flow (Just Like Minerva)**

### 1. **Initial Input** (10s)
"Multiple cash deposits under $10,000 threshold"

### 2. **AI Questions** (30s)
- "What is the pattern of these cash deposits?" → "Multiple deposits just under $10,000"
- "What is the customer's stated source of funds?" → "Cash business proceeds"
- "Does the activity match the customer profile?" → "Significant change from historical patterns"

### 3. **Smart Agent Launch** (45s)
- Orchestrator detects structuring + profile mismatch
- Spawns Pattern Detector (structuring behavior)
- Spawns OSINT Agent (profile verification)
- Shows real-time analysis on canvas

### 4. **Results & Learning** (30s)
- Pattern Agent: "Structuring behavior detected - amounts avoid reporting thresholds"
- Risk assessment: HIGH
- Patterns stored in Redis for future cases

## 🏆 **Why This Wins the Hackathon**

### **1. Technical Sophistication**
- Follows Minerva's proven multi-agent architecture
- Context-driven intelligence (not random agent spawning)
- Real pattern learning with Redis persistence

### **2. User Experience Excellence**
- Clean, intuitive entry point
- Guided context building
- Visual investigation progression

### **3. Business Impact**
- Reduces analyst workload (context-driven, not manual)
- Improves investigation quality (agents have context)
- Learns from every case (Redis pattern storage)

### **4. Demo Impact**
- Shows AI understanding context
- Proves intelligent agent coordination
- Demonstrates real learning/improvement

## 🌐 **Access Points**

- **Frontend**: http://localhost:3002 (Minerva-style interface)
- **API**: http://localhost:8001/generate-questions (Context builder)
- **Redis**: Real pattern storage and retrieval

## 🎤 **Winning Demo Script**

1. **"AML analysts are overwhelmed"** (15s)
2. **Enter query + show AI questions** (30s)
3. **Answer questions, watch agents spawn intelligently** (45s)
4. **Show investigation results + learning** (30s)
5. **"Context-driven AI that learns from every case"** (10s)

---

## 🎉 **Ready to Dominate!**

FlagFlow now combines:
- **Minerva's proven entry pattern** (input → questions → agents)
- **AML domain expertise** (financial crime focus)
- **Real learning mechanics** (Redis-powered improvement)
- **Professional polish** (production-ready architecture)

Perfect synthesis of research-grade AI and financial compliance! 🚀