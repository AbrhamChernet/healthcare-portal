import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import PatientProfile from '../models/PatientProfile.js';

// Get list of verified doctors for appointment booking
export const getDoctors = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find({ verificationStatus: 'VERIFIED' })
      .populate('userId', 'name email')
      .lean();

    const formatted = doctors.map(doc => ({
      doctorId: doc.userId._id,
      name: doc.userId.name,
      email: doc.userId.email,
      specialization: doc.specialization,
      licenseNumber: doc.licenseNumber,
      licenseStateOrCountry: doc.licenseStateOrCountry,
      bio: doc.bio,
      consultationFee: doc.consultationFee,
      availabilitySlots: doc.availabilitySlots
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve doctors: ' + error.message });
  }
};

// Admin: Get all doctors including pending/rejected
export const getAllDoctorsAdmin = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find()
      .populate('userId', 'name email createdAt')
      .lean();

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve doctors list: ' + error.message });
  }
};

// Admin: Approve or Reject doctor license
export const verifyDoctorStatus = async (req, res) => {
  try {
    const { doctorProfileId } = req.params;
    const { status, notes } = req.body;

    if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid verification status' });
    }

    const updated = await DoctorProfile.findByIdAndUpdate(
      doctorProfileId,
      {
        verificationStatus: status,
        verificationNotes: notes || '',
        verifiedAt: status === 'VERIFIED' ? new Date() : null,
        verifiedBy: req.user._id
      },
      { new: true }
    ).populate('userId', 'name email');

    res.json({ message: `Doctor status updated to ${status}`, doctor: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update doctor verification: ' + error.message });
  }
};

// Update Doctor Availability Slots
export const updateDoctorAvailability = async (req, res) => {
  try {
    const { slots, fee, bio } = req.body;
    const updated = await DoctorProfile.findOneAndUpdate(
      { userId: req.user._id },
      {
        $set: {
          ...(slots && { availabilitySlots: slots }),
          ...(fee !== undefined && { consultationFee: fee }),
          ...(bio !== undefined && { bio })
        }
      },
      { new: true }
    );
    res.json({ message: 'Doctor profile updated', profile: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile: ' + error.message });
  }
};

// Get or update patient profile & custom vital thresholds
export const getPatientProfile = async (req, res) => {
  try {
    const targetUserId = req.params.patientId || req.user._id;
    const patient = await PatientProfile.findOne({ userId: targetUserId }).populate('userId', 'name email');
    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve patient profile: ' + error.message });
  }
};

export const updatePatientThresholds = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { customVitalThresholds, chronicConditions, allergies } = req.body;

    const patient = await PatientProfile.findOneAndUpdate(
      { userId: patientId },
      {
        $set: {
          ...(customVitalThresholds && { customVitalThresholds }),
          ...(chronicConditions && { chronicConditions }),
          ...(allergies && { allergies })
        }
      },
      { new: true }
    );

    res.json({ message: 'Patient medical profile updated', patient });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update thresholds: ' + error.message });
  }
};

// Admin: Get all system users
export const getAllUsersAdmin = async (req, res) => {
  try {
    const users = await User.find().select('-password -mfaSecret').lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
