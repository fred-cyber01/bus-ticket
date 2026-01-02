// controllers/companyController.js
const Company = require('../models/Company');

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
exports.getCompanies = async (req, res, next) => {
  try {
    const companies = await Company.findAll();
    
    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Public
exports.getCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }
    
    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create company
// @route   POST /api/companies
// @access  Private/Admin
exports.createCompany = async (req, res, next) => {
  try {
    const company_name = req.body.company_name ?? req.body.name;
    const tin = req.body.tin;
    const phone = req.body.phone;
    const email = req.body.email;
    const address = req.body.address ?? null;

    if (!company_name || !tin || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'company_name, tin, phone, and email are required',
      });
    }

    if (!/^[0-9]{9}$/.test(String(tin))) {
      return res.status(400).json({
        success: false,
        message: 'TIN must be exactly 9 digits',
      });
    }

    if (!/^\S+@\S+\.\S+$/.test(String(email))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address',
      });
    }

    const existingEmail = await Company.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'Email is already in use',
      });
    }

    const existingTin = await Company.findByTin(tin);
    if (existingTin) {
      return res.status(409).json({
        success: false,
        message: 'TIN is already in use',
      });
    }

    const companyId = await Company.create({
      company_name,
      tin,
      phone,
      email,
      address,
    });
    
    const company = await Company.findById(companyId);
    
    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private/Admin
exports.updateCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }
    
    await Company.update(req.params.id, req.body);
    const updatedCompany = await Company.findById(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: updatedCompany,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private/Admin
exports.deleteCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }
    
    await Company.delete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Company deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve company registration
// @route   POST /api/admin/companies/:id/approve
// @access  Private/Admin
exports.approveCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    const adminId = req.user?.id;
    const updated = await Company.approve(req.params.id, adminId);

    res.status(200).json({
      success: true,
      message: 'Company approved successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Suspend (block) a company
// @route   POST /api/admin/companies/:id/suspend
// @access  Private/Admin
exports.suspendCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    const updated = await Company.block(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Company suspended successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unblock a company
// @route   POST /api/admin/companies/:id/unblock
// @access  Private/Admin
exports.unblockCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    const updated = await Company.unblock(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Company unblocked successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject company registration
// @route   POST /api/admin/companies/:id/reject
// @access  Private/Admin
exports.rejectCompany = async (req, res, next) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    const updated = await Company.reject(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Company rejected successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};
