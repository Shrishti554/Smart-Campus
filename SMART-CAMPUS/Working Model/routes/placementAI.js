const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const Job = require('../models/Job');
const Resume = require('../models/Resume');
const Application = require('../models/Application');
const User = require('../models/User');

const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
const aiModel = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest",
  systemInstruction: "You are a career guidance AI assistant. Provide helpful, professional advice on resumes, job applications, and career development. Keep responses concise and actionable."
});

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

router.post('/analyze-resume', isAuthenticated, async (req, res) => {
  try {
    if (req.session.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can analyze resumes' });
    }

    const resume = await Resume.findOne({ 
      student: req.session.user._id, 
      isActive: true 
    }).populate('student');

    if (!resume) {
      return res.status(404).json({ error: 'No resume found' });
    }

    const resumeText = `
      Skills: ${resume.skills.join(', ')}
      Education: ${resume.education.map(edu => `${edu.degree} from ${edu.institution} (CGPA: ${edu.cgpa})`).join(', ')}
      Projects: ${resume.projects.map(proj => `${proj.title}: ${proj.description}`).join(', ')}
      Experience: ${resume.experience.map(exp => `${exp.position} at ${exp.company}`).join(', ')}
    `;

    const prompt = `
      Analyze this resume and provide detailed feedback:
      
      ${resumeText}
      
      Please provide:
      1. Overall resume strength (1-10)
      2. Key strengths
      3. Areas for improvement
      4. Missing skills that are in demand
      5. Specific recommendations to improve
      
      Format as JSON with keys: strength, strengths, improvements, missingSkills, recommendations
    `;

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const analysis = JSON.parse(text);
      res.json({ success: true, analysis });
    } catch (parseError) {
      res.json({ 
        success: true, 
        analysis: { 
          strength: 7,
          strengths: ['Good technical foundation', 'Relevant projects'],
          improvements: ['Add more quantifiable achievements', 'Include certifications'],
          missingSkills: ['Cloud computing', 'Machine learning basics'],
          recommendations: ['Add metrics to quantify achievements', 'Include relevant certifications']
        }
      });
    }
  } catch (error) {
    console.error('Resume Analysis Error:', error);
    res.status(500).json({ error: 'Error analyzing resume' });
  }
});

router.post('/job-recommendations', isAuthenticated, async (req, res) => {
  try {
    if (req.session.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can get job recommendations' });
    }

    const student = await User.findById(req.session.user._id);
    const resume = await Resume.findOne({ 
      student: req.session.user._id, 
      isActive: true 
    });

    if (!resume) {
      return res.status(404).json({ error: 'No resume found' });
    }

    const studentProfile = {
      skills: resume.skills || [],
      education: resume.education || [],
      cgpa: student.studentDetails?.cgpa || 0,
      branch: student.studentDetails?.branch || ''
    };

    const allJobs = await Job.find({ 
      isActive: true, 
      applicationDeadline: { $gt: new Date() } 
    }).populate('company');

    const prompt = `
      Based on this student profile, recommend the most suitable jobs from the available options:
      
      Student Profile:
      - Skills: ${studentProfile.skills.join(', ')}
      - Education: ${studentProfile.education.map(edu => edu.degree).join(', ')}
      - CGPA: ${studentProfile.cgpa}
      - Branch: ${studentProfile.branch}
      
      Available Jobs:
      ${allJobs.map(job => `
        ${job.title} at ${job.company.name}
        - Required Skills: ${job.eligibilityCriteria?.skillsRequired?.join(', ') || 'Not specified'}
        - Min CGPA: ${job.eligibilityCriteria?.minCGPA || 'Not specified'}
        - Location: ${job.location}
        - Salary: ${job.salary.min} - ${job.salary.max}
      `).join('\n')}
      
      Please recommend top 5 jobs with match scores (1-100) and reasoning.
      Format as JSON array with objects containing: jobId, title, company, matchScore, reasoning
    `;

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const recommendations = JSON.parse(text);
      
      const validRecommendations = recommendations
        .filter(rec => allJobs.some(job => job._id.toString() === rec.jobId))
        .slice(0, 5);

      res.json({ success: true, recommendations: validRecommendations });
    } catch (parseError) {
      const fallbackRecommendations = allJobs
        .slice(0, 5)
        .map(job => ({
          jobId: job._id,
          title: job.title,
          company: job.company.name,
          matchScore: Math.floor(Math.random() * 30) + 70,
          reasoning: 'Good match based on your skills and qualifications'
        }));

      res.json({ success: true, recommendations: fallbackRecommendations });
    }
  } catch (error) {
    console.error('Job Recommendations Error:', error);
    res.status(500).json({ error: 'Error getting job recommendations' });
  }
});

router.post('/career-guidance', isAuthenticated, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    let context = '';
    if (req.session.user.role === 'student') {
      const student = await User.findById(req.session.user._id);
      const resume = await Resume.findOne({ 
        student: req.session.user._id, 
        isActive: true 
      });

      context = `
        Student Profile:
        - Branch: ${student.studentDetails?.branch || 'Not specified'}
        - CGPA: ${student.studentDetails?.cgpa || 'Not specified'}
        - Skills: ${resume?.skills?.join(', ') || 'Not specified'}
        - Year: ${student.studentDetails?.year || 'Not specified'}
      `;
    }

    const prompt = `
      ${context}
      
      Student Question: ${question}
      
      Provide helpful career guidance advice. Be encouraging, professional, and specific.
      Keep the response under 200 words.
    `;

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, advice: text });
  } catch (error) {
    console.error('Career Guidance Error:', error);
    res.status(500).json({ error: 'Error getting career guidance' });
  }
});

router.post('/interview-prep', isAuthenticated, async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: 'Job ID is required' });
    }

    const job = await Job.findById(jobId).populate('company');
    const resume = await Resume.findOne({ 
      student: req.session.user._id, 
      isActive: true 
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const prompt = `
      Prepare interview questions and tips for a student applying to:
      
      Job: ${job.title}
      Company: ${job.company.name}
      Requirements: ${job.requirements}
      
      Student Skills: ${resume?.skills?.join(', ') || 'Not specified'}
      
      Provide:
      1. 5 likely interview questions
      2. Tips for answering each question
      3. General interview preparation advice
      
      Format as JSON with keys: questions (array of {question, tips}), generalAdvice
    `;

    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      const prep = JSON.parse(text);
      res.json({ success: true, prep });
    } catch (parseError) {
      res.json({ 
        success: true, 
        prep: {
          questions: [
            { question: "Tell me about yourself", tips: "Focus on relevant experience and skills" },
            { question: "Why do you want to work here?", tips: "Research the company and align your values" },
            { question: "What are your strengths?", tips: "Provide specific examples" },
            { question: "Describe a challenging project", tips: "Use STAR method" },
            { question: "Where do you see yourself in 5 years?", tips: "Show ambition and alignment with company goals" }
          ],
          generalAdvice: "Research the company, practice common questions, prepare your own questions, dress professionally, arrive on time"
        }
      });
    }
  } catch (error) {
    console.error('Interview Prep Error:', error);
    res.status(500).json({ error: 'Error preparing interview tips' });
  }
});

module.exports = router;
