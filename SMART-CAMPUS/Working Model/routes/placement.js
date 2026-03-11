const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');
const User = require('../models/User');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/resumes');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueName + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

function isPlacementAdmin(req, res, next) {
  if (req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'placement')) {
    return next();
  }
  res.status(403).send('Access denied');
}

router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const user = req.session.user;
    let dashboardData = {};

    if (user.role === 'student') {
      const jobs = await Job.find({ 
        isActive: true, 
        applicationDeadline: { $gt: new Date() } 
      }).populate('company').sort({ createdAt: -1 }).limit(10);
      
      const applications = await Application.find({ student: user._id })
        .populate('job')
        .populate('company')
        .sort({ appliedAt: -1 });
      
      const interviews = await Interview.find({ student: user._id })
        .populate('job')
        .populate('company')
        .sort({ date: 1 });
      
      const notifications = await Notification.find({ recipient: user._id })
        .sort({ createdAt: -1 })
        .limit(5);

      dashboardData = { jobs, applications, interviews, notifications };
    } else if (user.role === 'admin' || user.role === 'placement') {
      const totalJobs = await Job.countDocuments({ isActive: true });
      const totalApplications = await Application.countDocuments();
      const totalStudents = await User.countDocuments({ role: 'student' });
      const totalCompanies = await Company.countDocuments({ isActive: true });
      const recentApplications = await Application.find()
        .populate('student')
        .populate('job')
        .sort({ appliedAt: -1 })
        .limit(10);

      dashboardData = { 
        totalJobs, 
        totalApplications, 
        totalStudents, 
        totalCompanies, 
        recentApplications 
      };
    }

    res.render('placement/dashboard', { user, ...dashboardData });
  } catch (error) {
    console.error('Placement Dashboard Error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

router.get('/jobs', isAuthenticated, async (req, res) => {
  try {
    const { search, location, jobType, minSalary } = req.query;
    let filter = { isActive: true, applicationDeadline: { $gt: new Date() } };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (jobType) {
      filter.jobType = jobType;
    }

    if (minSalary) {
      filter['salary.min'] = { $gte: parseInt(minSalary) };
    }

    const jobs = await Job.find(filter)
      .populate('company')
      .sort({ createdAt: -1 });

    const user = req.session.user;
    let appliedJobs = [];
    
    if (user.role === 'student') {
      const applications = await Application.find({ student: user._id });
      appliedJobs = applications.map(app => app.job.toString());
    }

    res.render('placement/jobs', { 
      user, 
      jobs, 
      appliedJobs,
      filters: { search, location, jobType, minSalary }
    });
  } catch (error) {
    console.error('Jobs Error:', error);
    res.status(500).send('Error loading jobs');
  }
});

router.get('/jobs/:id', isAuthenticated, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company');
    
    if (!job || !job.isActive) {
      return res.status(404).send('Job not found');
    }

    let hasApplied = false;
    if (req.session.user.role === 'student') {
      const application = await Application.findOne({ 
        student: req.session.user._id, 
        job: job._id 
      });
      hasApplied = !!application;
    }

    res.render('placement/job-details', { 
      user: req.session.user, 
      job, 
      hasApplied 
    });
  } catch (error) {
    console.error('Job Details Error:', error);
    res.status(500).send('Error loading job details');
  }
});

router.post('/jobs/:id/apply', isAuthenticated, async (req, res) => {
  try {
    if (req.session.user.role !== 'student') {
      return res.status(403).send('Only students can apply for jobs');
    }

    const job = await Job.findById(req.params.id);
    if (!job || !job.isActive) {
      return res.status(404).send('Job not found');
    }

    const existingApplication = await Application.findOne({ 
      student: req.session.user._id, 
      job: job._id 
    });

    if (existingApplication) {
      return res.status(400).send('You have already applied for this job');
    }

    const resume = await Resume.findOne({ 
      student: req.session.user._id, 
      isActive: true 
    });

    if (!resume) {
      return res.status(400).send('Please upload your resume first');
    }

    const application = new Application({
      student: req.session.user._id,
      job: job._id,
      resume: resume._id
    });

    await application.save();
    
    job.totalApplications += 1;
    await job.save();

    const notification = new Notification({
      recipient: req.session.user._id,
      title: 'Application Submitted',
      message: `Your application for ${job.title} at ${job.company} has been submitted successfully.`,
      type: 'application_status',
      relatedEntity: {
        entityType: 'Application',
        entityId: application._id
      }
    });
    await notification.save();

    res.redirect('/placement/jobs');
  } catch (error) {
    console.error('Apply Job Error:', error);
    res.status(500).send('Error submitting application');
  }
});

router.get('/resume', isAuthenticated, async (req, res) => {
  try {
    if (req.session.user.role !== 'student') {
      return res.status(403).send('Access denied');
    }

    const resume = await Resume.findOne({ 
      student: req.session.user._id, 
      isActive: true 
    });

    res.render('placement/resume', { user: req.session.user, resume });
  } catch (error) {
    console.error('Resume Error:', error);
    res.status(500).send('Error loading resume');
  }
});

router.post('/resume/upload', isAuthenticated, upload.single('resume'), async (req, res) => {
  try {
    if (req.session.user.role !== 'student') {
      return res.status(403).send('Access denied');
    }

    if (!req.file) {
      return res.status(400).send('Please upload a resume file');
    }

    await Resume.updateMany(
      { student: req.session.user._id },
      { isActive: false }
    );

    const resume = new Resume({
      student: req.session.user._id,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      skills: req.body.skills ? req.body.skills.split(',').map(s => s.trim()) : [],
      projects: req.body.projects ? JSON.parse(req.body.projects) : [],
      education: req.body.education ? JSON.parse(req.body.education) : [],
      experience: req.body.experience ? JSON.parse(req.body.experience) : [],
      personalInfo: {
        phone: req.body.phone,
        address: req.body.address,
        linkedin: req.body.linkedin,
        github: req.body.github
      }
    });

    await resume.save();

    await User.findByIdAndUpdate(req.session.user._id, {
      'studentDetails.resumeUploaded': true
    });

    res.redirect('/placement/resume');
  } catch (error) {
    console.error('Resume Upload Error:', error);
    res.status(500).send('Error uploading resume');
  }
});

router.get('/applications', isAuthenticated, async (req, res) => {
  try {
    let applications;
    
    if (req.session.user.role === 'student') {
      applications = await Application.find({ student: req.session.user._id })
        .populate('job')
        .populate('company')
        .sort({ appliedAt: -1 });
    } else if (req.session.user.role === 'admin' || req.session.user.role === 'placement') {
      applications = await Application.find({})
        .populate('student')
        .populate('job')
        .populate('company')
        .sort({ appliedAt: -1 });
    }

    res.render('placement/applications', { 
      user: req.session.user, 
      applications 
    });
  } catch (error) {
    console.error('Applications Error:', error);
    res.status(500).send('Error loading applications');
  }
});

router.post('/applications/:id/status', isPlacementAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        adminNotes: notes,
        lastUpdated: new Date()
      },
      { new: true }
    ).populate('student').populate('job');

    const notification = new Notification({
      recipient: application.student._id,
      title: 'Application Status Updated',
      message: `Your application for ${application.job.title} has been ${status.toLowerCase()}.`,
      type: 'application_status',
      relatedEntity: {
        entityType: 'Application',
        entityId: application._id
      }
    });
    await notification.save();

    res.redirect('/placement/applications');
  } catch (error) {
    console.error('Update Application Status Error:', error);
    res.status(500).send('Error updating application status');
  }
});

module.exports = router;
