import { CreditRepository } from '../repository/credit.repository.js';
import { hashPassword } from '../util/auth.util.js';
import { sendSuccess, sendError } from '../util/response.util.js';

export const onboardPartner = async (req, res) => {
  const {
    companyName,
    contactName,
    contactEmail,
    contactPhone,
    creditLimit,
    userName,
    userEmail,
    userPassword,
    isApprover
  } = req.body;

  if (!companyName || !contactName || !contactEmail || !contactPhone || !creditLimit || !userName || !userEmail || !userPassword) {
    return sendError(res, 'Missing required fields', 'Onboarding failed', 400);
  }

  const tenantSequelize = req.tenantSequelize;

  try {
    await tenantSequelize.authenticate();
    const creditRepo = new CreditRepository(tenantSequelize);
    await tenantSequelize.sync();

    const result = await tenantSequelize.transaction(async (t) => {
      // 1. Create CreditCustomer
      const creditCustomer = await creditRepo.createCreditCustomer({
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        creditLimit
      }, t);

      // 2. Hash password
      const hashedPassword = await hashPassword(userPassword);

      // 3. Create CustomerUser and associate with CreditCustomer
      const customerUser = await creditRepo.createCustomerUser({
        name: userName,
        email: userEmail,
        password: hashedPassword,
        isApprover: isApprover !== undefined ? isApprover : true,
        creditCustomerId: creditCustomer.id
      }, t);

      return { creditCustomer, customerUser };
    });

    return sendSuccess(res, result, 'Credit partner onboarded successfully', 201);
  } catch (err) {
    return sendError(res, err, 'Failed to onboard credit partner', 500);
  }
}; 