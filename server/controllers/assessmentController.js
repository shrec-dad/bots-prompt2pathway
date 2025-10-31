const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose')
const Assessment = require('../models/assessmentModel');

function mapQuestionAudios(questions, files, indexes) {
  if (!questions || !Array.isArray(questions)) return questions;
  if (!files || !indexes) return questions;

  const updatedQuestions = [...questions];

  files.forEach((file, i) => {
    const questionIndex = indexes[i]; // index of question this file belongs to
    if (updatedQuestions[questionIndex]) {
      updatedQuestions[questionIndex].audio = `/uploads/audio/${file.filename}`;
    }
  });

  return updatedQuestions;
}

function deleteFileIfExists(filePath) {
  if (!filePath) return;
  const fullPath = path.join(__dirname, '..', filePath);
  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (!err) {
      fs.unlink(fullPath, (err) => {
        if (err) console.error('Failed to delete file:', fullPath, err);
      });
    }
  });
}

const getAllAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({ user_id: req.user.userId });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAssessmentBySlug = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ slug: req.params.slug });
    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createAssessment = async (req, res) => {
  try {
    const assessmentData = { ...req.body};
    
    if (assessmentData.tags) {
      try {
        assessmentData.tags = JSON.parse(assessmentData.tags);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON in tags field' });
      }
    }

    if (assessmentData.questions) {
      try {
        assessmentData.questions = JSON.parse(assessmentData.questions);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON in questions field' });
      }
    }

    if (req.files) {
      if (req.files.welcomeMessageAudio) assessmentData.welcomeMessageAudio = `/uploads/audio/${req.files.welcomeMessageAudio[0].filename}`;
      if (req.files.keepGoingMessageAudio) assessmentData.keepGoingMessageAudio = `/uploads/audio/${req.files.keepGoingMessageAudio[0].filename}`;
      if (req.files.congratulationMessageAudio) assessmentData.congratulationMessageAudio = `/uploads/audio/${req.files.congratulationMessageAudio[0].filename}`;
    
      const indexes = req.body.questionAudioIndexes
        ? JSON.parse(req.body.questionAudioIndexes)
        : [];
        assessmentData.questions = mapQuestionAudios(assessmentData.questions, req.files.questionAudios, indexes);
    }

    assessmentData.user_id = req.user.userId;

    const newAssessment = new Assessment(assessmentData);
    const savedAssessment = await newAssessment.save();
    res.status(201).json(savedAssessment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateAssessment = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.tags) {
      try {
        updateData.tags = JSON.parse(updateData.tags);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON in tags field' });
      }
    }

    if (updateData.questions) {
      try {
        updateData.questions = JSON.parse(updateData.questions);
      } catch {
        return res.status(400).json({ error: 'Invalid JSON in questions field' });
      }
    }

    if (req.files) {
      if (req.files.welcomeMessageAudio) updateData.welcomeMessageAudio = `/uploads/audio/${req.files.welcomeMessageAudio[0].filename}`;
      if (req.files.keepGoingMessageAudio) updateData.keepGoingMessageAudio = `/uploads/audio/${req.files.keepGoingMessageAudio[0].filename}`;
      if (req.files.congratulationMessageAudio) updateData.congratulationMessageAudio = `/uploads/audio/${req.files.congratulationMessageAudio[0].filename}`;
    
      const indexes = req.body.questionAudioIndexes
        ? JSON.parse(req.body.questionAudioIndexes)
        : [];
        updateData.questions = mapQuestionAudios(updateData.questions, req.files.questionAudios, indexes);
    }

    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' });

    if (req.files?.welcomeMessageAudio && assessment.welcomeMessageAudio) {
      deleteFileIfExists(assessment.welcomeMessageAudio);
    }
    if (req.files?.keepGoingMessageAudio && assessment.keepGoingMessageAudio) {
      deleteFileIfExists(assessment.keepGoingMessageAudio);
    }
    if (req.files?.congratulationMessageAudio && assessment.congratulationMessageAudio) {
      deleteFileIfExists(assessment.congratulationMessageAudio);
    }

    assessment.questions.forEach((q, idx) => {
      const newFileIndex = req.body.questionAudioIndexes
        ? JSON.parse(req.body.questionAudioIndexes)
        : [];
      if (q.audio && newFileIndex.includes(idx)) {
        deleteFileIfExists(q.audio);
      }
    });

    Object.keys(updateData).forEach((key) => {
      assessment[key] = updateData[key];
    });

    const updatedAssessment = await assessment.save();
    res.json(updatedAssessment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteAssessment = async (req, res) => {
  try {
    const deletedAssessment = await Assessment.findByIdAndDelete(req.params.id);
    if (!deletedAssessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    } else {
      if (deletedAssessment.welcomeMessageAudio) deleteFileIfExists(deletedAssessment.welcomeMessageAudio);
      if (deletedAssessment.keepGoingMessageAudio) deleteFileIfExists(deletedAssessment.keepGoingMessageAudio);
      if (deletedAssessment.congratulationMessageAudio) deleteFileIfExists(deletedAssessment.congratulationMessageAudio);
      deletedAssessment.questions.forEach(q => {
        if (q.audio) deleteFileIfExists(q.audio);
      });
    }
    res.json({ message: 'Assessment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const duplicateAssessment = async (req, res) => {
  try {
    const original = await Assessment.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const duplicated = new Assessment({
      ...original.toObject(),
      _id: undefined
    });

    const savedDuplicate = await duplicated.save();
    res.status(201).json(savedDuplicate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllAssessments,
  getAssessmentBySlug,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  duplicateAssessment
};
