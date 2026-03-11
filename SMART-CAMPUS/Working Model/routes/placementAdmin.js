const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');
const User = require('../models/User');

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

router.get('/admin', isPlacementAdmin, async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments({ isActive: true });
    const totalApplications = await Application.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalCompanies = await Company.countDocuments({ isActive: true });
    const totalInterviews = await Interview.countDocuments({ status: 'Scheduled' });

    const selectedStudents = await Application.countDocuments({ status: 'Selected' });
    const placementRate = totalStudents > 0 ? ((selectedStudents / totalStudents) * 100).toFixed(2) : 0;

    const salaryStats = await Application.aggregate([
      { $match: { status: 'Selected' } },
      { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'job' } },
      { $unwind: '$job' },
      { $group: {
        _id: null,
        avgSalary: { $avg: '$job.salary.min' },
        maxSalary: { $max: '$job.salary.min' },
        minSalary: { $min: '$job.salary.min' }
      }}
    ]);

    const recentApplications = await Application.find()
      .populate('student')
      .populate('job')
      .populate('company')
      .sort({ appliedAt: -1 })
      .limit(10);

    const upcomingInterviews = await Interview.find({ 
      status: 'Scheduled',
      date: { $gte: new Date() }
    })
    .populate('student')
    .populate('job')
    .populate('company')
    .sort({ date: 1 })
    .limit(10);

    res.render('placement/admin', {
      user: req.session.user,
      stats: {
        totalJobs,
        totalApplications,
        totalStudents,
        totalCompanies,
        totalInterviews,
        selectedStudents,
        placementRate: parseFloat(placementRate),
        salaryStats: salaryStats[0] || { avgSalary: 0, maxSalary: 0, minSalary: 0 }
      },
      recentApplications,
      upcomingInterviews
    });
  } catch (error) {
    console.error('Placement Admin Error:', error);
    res.status(500).send('Error loading admin dashboard');
  }
});

router.get('/admin/jobs', isPlacementAdmin, async (req, res) => {
  try {
    const jobs = await Job.find({})
      .populate('company')
      .populate('postedBy')
      .sort({ createdAt: -1 });

    res.render('placement/admin-jobs', { user: req.session.user, jobs });
  } catch (error) {
    console.error('Admin Jobs Error:', error);
    res.status(500).send('Error loading jobs');
  }
});

router.get('/admin/jobs/new', isPlacementAdmin, async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true }).sort({ name: 1 });
    res.render('placement/job-form', { user: req.session.user, companies, job: null });
  } catch (error) {
    console.error('New Job Form Error:', error);
    res.status(500).send('Error loading job form');
  }
});

router.post('/admin/jobs', isPlacementAdmin, async (req, res) => {
  try {
    const {
      title, company, description, requirements, salaryMin, salaryMax,
      location, jobType, eligibilityCriteria, applicationDeadline,
      positionsAvailable, workMode
    } = req.body;

    const job = new Job({
      title,
      company,
      postedBy: req.session.user._id,
      description,
      requirements,
      salary: {
        min: salaryMin,
        max: salaryMax,
        currency: 'INR',
        type: 'per annum'
      },
      location,
      jobType,
      eligibilityCriteria: eligibilityCriteria ? JSON.parse(eligibilityCriteria) : {},
      applicationDeadline: new Date(applicationDeadline),
      positionsAvailable: parseInt(positionsAvailable),
      workMode
    });

    await job.save();

    const students = await User.find({ role: 'student' });
    const notifications = students.map(student => ({
      recipient: student._id,
      title: 'New Job Opportunity',
      message: `A new job opportunity "${title}" is now available. Apply before ${applicationDeadline}.`,
      type: 'job_posted',
      relatedEntity: {
        entityType: 'Job',
        entityId: job._id
      },
      actionUrl: `/placement/jobs/${job._id}`
    }));

    await Notification.insertMany(notifications);

    res.redirect('/placement/admin/jobs');
  } catch (error) {
    console.error('Create Job Error:', error);
    res.status(500).send('Error creating job');
  }
});

router.get('/admin/jobs/:id/edit', isPlacementAdmin, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('company');
    const companies = await Company.find({ isActive: true }).sort({ name: 1 });
    
    if (!job) {
      return res.status(404).send('Job not found');
    }

    res.render('placement/job-form', { user: req.session.user, companies, job });
  } catch (error) {
    console.error('Edit Job Form Error:', error);
    res.status(500).send('Error loading job form');
  }
});

router.post('/admin/jobs/:id', isPlacementAdmin, async (req, res) => {
  try {
    const {
      title, company, description, requirements, salaryMin, salaryMax,
      location, jobType, eligibilityCriteria, applicationDeadline,
      positionsAvailable, workMode, isActive
    } = req.body;

    await Job.findByIdAndUpdate(req.params.id, {
      title,
      company,
      description,
      requirements,
      salary: {
        min: salaryMin,
        max: salaryMax,
        currency: 'INR',
        type: 'per annum'
      },
      location,
      jobType,
      eligibilityCriteria: eligibilityCriteria ? JSON.parse(eligibilityCriteria) : {},
      applicationDeadline: new Date(applicationDeadline),
      positionsAvailable: parseInt(positionsAvailable),
      workMode,
      isActive: isActive === 'on'
    });

    res.redirect('/placement/admin/jobs');
  } catch (error) {
    console.error('Update Job Error:', error);
    res.status(500).send('Error updating job');
  }
});

router.get('/admin/companies', isPlacementAdmin, async (req, res) => {
  try {
    const companies = await Company.find({}).sort({ name: 1 });
    res.render('placement/admin-companies', { user: req.session.user, companies });
  } catch (error) {
    console.error('Admin Companies Error:', error);
    res.status(500).send('Error loading companies');
  }
});

router.post('/admin/companies', isPlacementAdmin, async (req, res) => {
  try {
    const {
      name, industry, description, website, contactPersonName,
      contactPersonEmail, contactPersonPhone, address
    } = req.body;

    const company = new Company({
      name,
      industry,
      description,
      website,
      contactPerson: {
        name: contactPersonName,
        email: contactPersonEmail,
        phone: contactPersonPhone
      },
      address: address ? JSON.parse(address) : {}
    });

    await company.save();
    res.redirect('/placement/admin/companies');
  } catch (error) {
    console.error('Create Company Error:', error);
    res.status(500).send('Error creating company');
  }
});

router.get('/admin/interviews', isPlacementAdmin, async (req, res) => {
  try {
    const interviews = await Interview.find({})
      .populate('student')
      .populate('job')
      .populate('company')
      .populate('application')
      .sort({ date: -1 });

    res.render('placement/admin-interviews', { user: req.session.user, interviews });
  } catch (error) {
    console.error('Admin Interviews Error:', error);
    res.status(500).send('Error loading interviews');
  }
});

router.post('/admin/interviews/schedule', isPlacementAdmin, async (req, res) => {
  try {
    const {
      applicationId, date, time, duration, mode, location,
      meetingLink, interviewerName, interviewerEmail,
      interviewerPhone, interviewerDesignation, instructions
    } = req.body;

    const application = await Application.findById(applicationId)
      .populate('student')
      .populate('job')
      .populate('company');

    if (!application) {
      return res.status(404).send('Application not found');
    }

    const interview = new Interview({
      application: applicationId,
      student: application.student._id,
      job: application.job._id,
      company: application.company._id,
      scheduledBy: req.session.user._id,
      date: new Date(date),
      time,
      duration,
      mode,
      location: mode === 'Offline' ? location : null,
      meetingLink: mode === 'Online' ? meetingLink : null,
      interviewer: {
        name: interviewerName,
        email: interviewerEmail,
        phone: interviewerPhone,
        designation: interviewerDesignation
      },
      instructions
    });

    await interview.save();

    await Application.findByIdAndUpdate(applicationId, {
      status: 'Interview Scheduled',
      interviewDetails: {
        date: new Date(date),
        time,
        mode,
        location: mode === 'Offline' ? location : null,
        meetingLink: mode === 'Online' ? meetingLink : null,
        interviewer: interviewerName
      }
    });

    const notification = new Notification({
      recipient: application.student._id,
      title: 'Interview Scheduled',
      message: `Your interview for ${application.job.title} has been scheduled on ${date} at ${time}.`,
      type: 'interview_scheduled',
      relatedEntity: {
        entityType: 'Interview',
        entityId: interview._id
      }
    });
    await notification.save();

    res.redirect('/placement/admin/interviews');
  } catch (error) {
    console.error('Schedule Interview Error:', error);
    res.status(500).send('Error scheduling interview');
  }
});

router.get('/admin/analytics', isPlacementAdmin, async (req, res) => {
  try {
    const monthlyApplications = await Application.aggregate([
      {
        $group: {
          _id: { $month: '$appliedAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const companyStats = await Application.aggregate([
      { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'job' } },
      { $unwind: '$job' },
      { $lookup: { from: 'companies', localField: 'job.company', foreignField: '_id', as: 'company' } },
      { $unwind: '$company' },
      {
        $group: {
          _id: '$company.name',
          applications: { $sum: 1 },
          selected: { $sum: { $cond: [{ $eq: ['$status', 'Selected'] }, 1, 0] } }
        }
      },
      { $sort: { applications: -1 } },
      { $limit: 10 }
    ]);

    const branchStats = await Application.aggregate([
      { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'student' } },
      { $unwind: '$student' },
      {
        $group: {
          _id: '$student.studentDetails.branch',
          applications: { $sum: 1 },
          selected: { $sum: { $cond: [{ $eq: ['$status', 'Selected'] }, 1, 0] } }
        }
      },
      { $sort: { applications: -1 } }
    ]);

    res.render('placement/analytics', {
      user: req.session.user,
      monthlyApplications,
      companyStats,
      branchStats
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).send('Error loading analytics');
  }
});

module.exports = router;
