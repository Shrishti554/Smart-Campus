# Placement Portal Module - Smart Campus System

A comprehensive placement management system integrated into the Smart Campus Management System, designed to streamline campus recruitment activities for students, administrators, and companies.

## Features Overview

### 👥 User Roles & Access Control
- **Students**: Browse jobs, apply, upload resumes, track applications, receive notifications
- **Placement Cell/Admin**: Post jobs, manage applications, schedule interviews, view analytics
- **Companies**: Post job requirements, view student profiles, shortlist candidates

### 💼 Job Management System
- **Job Posting**: Comprehensive job listings with detailed requirements
- **Advanced Filtering**: Search by location, job type, salary, skills
- **Eligibility Criteria**: CGPA requirements, branch preferences, skill matching
- **Application Tracking**: Real-time status updates throughout the recruitment process

### 📄 Resume Management
- **PDF Upload**: Secure resume storage with file validation
- **Skill Management**: Dynamic skill tagging and categorization
- **Profile Builder**: Education, projects, experience tracking
- **Version Control**: Multiple resume versions with active status management

### 📊 Application Tracking
- **Status Pipeline**: Applied → Shortlisted → Interview → Selected/Rejected
- **Interview Scheduling**: Automated interview coordination with calendar integration
- **Communication**: Built-in notification system for status updates
- **Analytics**: Application statistics and success metrics

### 🤖 AI-Powered Features
- **Resume Analysis**: AI-driven resume evaluation and improvement suggestions
- **Job Recommendations**: Personalized job matching based on skills and preferences
- **Career Guidance**: Interactive AI chatbot for career advice and interview preparation
- **Interview Preparation**: Role-specific interview questions and tips

### 📈 Analytics Dashboard
- **Placement Statistics**: Real-time placement rates and package analytics
- **Company Insights**: Recruitment patterns and company performance metrics
- **Student Analytics**: Application trends and success rates
- **Visual Reports**: Interactive charts and data visualization

## Technical Architecture

### Backend (Node.js + Express)
```
routes/
├── placement.js          # Student-facing placement routes
├── placementAdmin.js     # Admin management routes
└── placementAI.js        # AI-powered features

models/
├── Job.js               # Job postings schema
├── Company.js           # Company information
├── Application.js       # Job applications
├── Resume.js           # Resume data management
├── Interview.js        # Interview scheduling
└── Notification.js     # Notification system
```

### Frontend (EJS Templates)
```
views/placement/
├── dashboard.ejs        # Main placement dashboard
├── jobs.ejs            # Job listings with filtering
├── job-details.ejs     # Individual job pages
├── applications.ejs    # Application tracking
├── resume.ejs          # Resume management
├── admin.ejs           # Admin dashboard
└── job-form.ejs        # Job creation/editing
```

### Database Schema (MongoDB)

#### Users Collection (Enhanced)
```javascript
{
  email: String,
  password: String,
  role: ['student', 'admin', 'placement', 'company'],
  studentDetails: {
    rollNumber: String,
    branch: String,
    year: Number,
    cgpa: Number,
    backlogs: Number,
    passoutYear: Number,
    skills: [String],
    resumeUploaded: Boolean
  },
  companyDetails: {
    companyName: String,
    companyVerified: Boolean,
    companyId: ObjectId
  }
}
```

#### Jobs Collection
```javascript
{
  title: String,
  company: ObjectId,
  postedBy: ObjectId,
  description: String,
  requirements: String,
  salary: {
    min: Number,
    max: Number,
    currency: String,
    type: String
  },
  location: String,
  jobType: ['Full-time', 'Part-time', 'Internship', 'Contract'],
  eligibilityCriteria: {
    minCGPA: Number,
    maxBacklogs: Number,
    branches: [String],
    passoutYear: Number,
    skillsRequired: [String]
  },
  applicationDeadline: Date,
  workMode: ['On-site', 'Remote', 'Hybrid'],
  positionsAvailable: Number,
  isActive: Boolean,
  totalApplications: Number
}
```

## API Endpoints

### Student APIs
- `GET /placement/dashboard` - Student placement dashboard
- `GET /placement/jobs` - Browse job listings
- `GET /placement/jobs/:id` - View job details
- `POST /placement/jobs/:id/apply` - Apply for job
- `GET /placement/applications` - View applications
- `GET /placement/resume` - Resume management
- `POST /placement/resume/upload` - Upload/update resume

### Admin APIs
- `GET /placement/admin` - Admin dashboard
- `GET /placement/admin/jobs` - Manage job postings
- `POST /placement/admin/jobs` - Create new job
- `GET /placement/admin/companies` - Manage companies
- `POST /placement/admin/companies` - Add company
- `GET /placement/admin/interviews` - Interview management
- `POST /placement/admin/interviews/schedule` - Schedule interviews
- `GET /placement/admin/analytics` - Placement analytics

### AI APIs
- `POST /placement/ai/analyze-resume` - AI resume analysis
- `POST /placement/ai/job-recommendations` - Personalized recommendations
- `POST /placement/ai/career-guidance` - Career advice chatbot
- `POST /placement/ai/interview-prep` - Interview preparation

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Google Generative AI API Key (for AI features)

### Installation Steps
1. **Install Dependencies**
```bash
cd SMART-CAMPUS/Working\ Model
npm install multer
```

2. **Environment Configuration**
Update `server.js` with your MongoDB connection and AI API key:
```javascript
mongoose.connect('mongodb://localhost:27017/smart')
const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
```

3. **Create Upload Directory**
```bash
mkdir -p public/uploads/resumes
```

4. **Start the Server**
```bash
node server.js
```

5. **Access the Application**
- Main Application: http://localhost:3000
- Placement Portal: http://localhost:3000/placement/dashboard

## User Guide

### For Students
1. **Complete Profile**: Fill in academic details and upload resume
2. **Browse Jobs**: Use filters to find suitable opportunities
3. **Apply for Jobs**: One-click application with resume attachment
4. **Track Applications**: Monitor application status in real-time
5. **AI Assistance**: Get resume analysis and job recommendations
6. **Interview Preparation**: Use AI chatbot for interview tips

### For Administrators
1. **Company Management**: Add and verify partner companies
2. **Job Posting**: Create detailed job listings with eligibility criteria
3. **Application Review**: Shortlist candidates and manage application pipeline
4. **Interview Scheduling**: Coordinate interviews with students and companies
5. **Analytics**: Monitor placement statistics and generate reports
6. **Notifications**: Send updates to students about new opportunities

### For Companies
1. **Registration**: Create company profile and get verified
2. **Job Posting**: Publish job requirements and eligibility criteria
3. **Candidate Review**: Access student profiles and shortlist candidates
4. **Interview Management**: Schedule and conduct interviews
5. **Selection Process**: Update application status and make offers

## AI Features Integration

### Resume Analysis
The AI analyzes uploaded resumes and provides:
- Overall strength score (1-10)
- Key strengths identification
- Areas for improvement
- Missing in-demand skills
- Specific actionable recommendations

### Job Recommendations
Personalized job matching based on:
- Skills compatibility
- Academic performance
- Career preferences
- Industry trends
- Historical placement data

### Career Guidance Chatbot
24/7 AI assistance for:
- Career path planning
- Skill development advice
- Interview preparation
- Industry insights
- Resume building tips

## Security Features

### Authentication & Authorization
- Role-based access control
- Session management
- Password hashing with bcrypt
- Secure file upload validation

### Data Protection
- Input sanitization
- File type restrictions
- Secure file storage
- Privacy controls for student data

## Performance Optimizations

### Database Optimization
- Indexed queries for fast search
- Efficient aggregation pipelines
- Pagination for large datasets
- Caching for frequently accessed data

### Frontend Optimization
- Lazy loading for job listings
- Optimized image loading
- Minimal API calls
- Responsive design patterns

## Future Enhancements

### Planned Features
- **Mobile Application**: Native iOS/Android apps
- **Video Interviews**: Integrated video conferencing
- **Assessment Tests**: Online skill assessment platform
- **Company Dashboard**: Enhanced company portal
- **Advanced Analytics**: Predictive analytics for placement trends
- **Integration APIs**: External job board integration

### Scalability Improvements
- **Microservices Architecture**: Service separation for better scaling
- **Cloud Deployment**: AWS/Azure deployment options
- **Load Balancing**: Horizontal scaling capabilities
- **CDN Integration**: Global content delivery

## Support & Maintenance

### Troubleshooting
- Check MongoDB connection status
- Verify file upload permissions
- Monitor AI API rate limits
- Review server logs for errors

### Regular Maintenance
- Database backups and optimization
- Log rotation and monitoring
- Security updates and patches
- Performance monitoring and tuning

## Contributing

### Code Standards
- Follow ESLint configuration
- Use meaningful variable names
- Add comments for complex logic
- Maintain consistent code formatting

### Testing
- Unit tests for API endpoints
- Integration tests for workflows
- UI testing for critical paths
- Performance testing for scalability

---

**Placement Portal Module** - Transforming campus recruitment with intelligent automation and personalized career guidance.
