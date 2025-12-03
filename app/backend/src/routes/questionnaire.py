from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import json
import os

questionnaire_router = APIRouter()

BACKGROUND_INFO_FILE = "assets/background_information.txt"


class EEOData(BaseModel):
    gender: Optional[str] = None
    race_ethnicity: Optional[str] = None
    protected_veteran: Optional[bool] = None
    disability: Optional[bool] = None


class WorkAuthData(BaseModel):
    legally_authorized: Optional[bool] = None
    sponsorship_required: Optional[bool] = None
    current_visa: Optional[str] = None


class BackgroundCheckData(BaseModel):
    willing_to_undergo: Optional[bool] = None
    felony_conviction: Optional[bool] = None
    pending_charges: Optional[bool] = None


class ExportControlData(BaseModel):
    citizen_or_resident: Optional[bool] = None
    export_control_restrictions: Optional[bool] = None
    us_person: Optional[bool] = None


class ConflictOfInterestData(BaseModel):
    relatives_at_company: Optional[bool] = None
    competitor_work: Optional[bool] = None
    financial_conflicts: Optional[bool] = None


class DataPrivacyData(BaseModel):
    data_processing_consent: Optional[bool] = None
    policy_agreement: Optional[bool] = None


class EmploymentEligibilityData(BaseModel):
    over_18: Optional[bool] = None
    can_provide_documentation: Optional[bool] = None


class CompensationData(BaseModel):
    salary_expectations: Optional[str] = None
    overtime_eligible: Optional[bool] = None


class LocationData(BaseModel):
    work_from_location: Optional[bool] = None
    willing_to_relocate: Optional[bool] = None


class QuestionnaireData(BaseModel):
    eeo: Optional[EEOData] = None
    work_authorization: Optional[WorkAuthData] = None
    background_check: Optional[BackgroundCheckData] = None
    export_control: Optional[ExportControlData] = None
    conflict_of_interest: Optional[ConflictOfInterestData] = None
    data_privacy: Optional[DataPrivacyData] = None
    employment_eligibility: Optional[EmploymentEligibilityData] = None
    compensation: Optional[CompensationData] = None
    location: Optional[LocationData] = None


@questionnaire_router.post("/api/background-questionnaire")
async def save_background_questionnaire(data: QuestionnaireData):
    """Save background questionnaire responses to file"""
    try:
        # Format the data nicely for the text file
        content = "=" * 60 + "\n"
        content += "BACKGROUND INFORMATION QUESTIONNAIRE\n"
        content += "=" * 60 + "\n\n"

        # EEO Section
        if data.eeo:
            content += "1. EQUAL EMPLOYMENT OPPORTUNITY (EEO)\n"
            content += "-" * 60 + "\n"
            content += f"Gender: {data.eeo.gender or 'Not specified'}\n"
            content += f"Race/Ethnicity: {data.eeo.race_ethnicity or 'Not specified'}\n"
            content += f"Protected Veteran: {'Yes' if data.eeo.protected_veteran else 'No' if data.eeo.protected_veteran is False else 'Not specified'}\n"
            content += f"Disability: {'Yes' if data.eeo.disability else 'No' if data.eeo.disability is False else 'Not specified'}\n\n"

        # Work Authorization
        if data.work_authorization:
            content += "2. WORK AUTHORIZATION\n"
            content += "-" * 60 + "\n"
            content += f"Legally Authorized: {'Yes' if data.work_authorization.legally_authorized else 'No' if data.work_authorization.legally_authorized is False else 'Not specified'}\n"
            content += f"Sponsorship Required: {'Yes' if data.work_authorization.sponsorship_required else 'No' if data.work_authorization.sponsorship_required is False else 'Not specified'}\n"
            content += (
                f"Current Visa: {data.work_authorization.current_visa or 'None'}\n\n"
            )

        # Background Check
        if data.background_check:
            content += "3. BACKGROUND CHECK CONSENT\n"
            content += "-" * 60 + "\n"
            content += f"Willing to Undergo: {'Yes' if data.background_check.willing_to_undergo else 'No' if data.background_check.willing_to_undergo is False else 'Not specified'}\n"
            content += f"Felony Conviction: {'Yes' if data.background_check.felony_conviction else 'No' if data.background_check.felony_conviction is False else 'Not specified'}\n"
            content += f"Pending Charges: {'Yes' if data.background_check.pending_charges else 'No' if data.background_check.pending_charges is False else 'Not specified'}\n\n"

        # Export Control
        if data.export_control:
            content += "4. EXPORT CONTROL / SECURITY\n"
            content += "-" * 60 + "\n"
            content += f"Citizen/Resident: {'Yes' if data.export_control.citizen_or_resident else 'No' if data.export_control.citizen_or_resident is False else 'Not specified'}\n"
            content += f"Export Control Restrictions: {'Yes' if data.export_control.export_control_restrictions else 'No' if data.export_control.export_control_restrictions is False else 'Not specified'}\n"
            content += f"U.S. Person (ITAR/EAR): {'Yes' if data.export_control.us_person else 'No' if data.export_control.us_person is False else 'Not specified'}\n\n"

        # Conflict of Interest
        if data.conflict_of_interest:
            content += "5. CONFLICT OF INTEREST\n"
            content += "-" * 60 + "\n"
            content += f"Relatives at Company: {'Yes' if data.conflict_of_interest.relatives_at_company else 'No' if data.conflict_of_interest.relatives_at_company is False else 'Not specified'}\n"
            content += f"Competitor Work: {'Yes' if data.conflict_of_interest.competitor_work else 'No' if data.conflict_of_interest.competitor_work is False else 'Not specified'}\n"
            content += f"Financial Conflicts: {'Yes' if data.conflict_of_interest.financial_conflicts else 'No' if data.conflict_of_interest.financial_conflicts is False else 'Not specified'}\n\n"

        # Data Privacy
        if data.data_privacy:
            content += "6. DATA PRIVACY CONSENT\n"
            content += "-" * 60 + "\n"
            content += f"Data Processing Consent: {'Yes' if data.data_privacy.data_processing_consent else 'No' if data.data_privacy.data_processing_consent is False else 'Not specified'}\n"
            content += f"Policy Agreement: {'Yes' if data.data_privacy.policy_agreement else 'No' if data.data_privacy.policy_agreement is False else 'Not specified'}\n\n"

        # Employment Eligibility
        if data.employment_eligibility:
            content += "7. EMPLOYMENT ELIGIBILITY / AGE\n"
            content += "-" * 60 + "\n"
            content += f"Over 18: {'Yes' if data.employment_eligibility.over_18 else 'No' if data.employment_eligibility.over_18 is False else 'Not specified'}\n"
            content += f"Can Provide Documentation: {'Yes' if data.employment_eligibility.can_provide_documentation else 'No' if data.employment_eligibility.can_provide_documentation is False else 'Not specified'}\n\n"

        # Compensation
        if data.compensation:
            content += "8. COMPENSATION DISCLOSURE\n"
            content += "-" * 60 + "\n"
            content += f"Salary Expectations: {data.compensation.salary_expectations or 'Not specified'}\n"
            content += f"Overtime Eligible: {'Yes' if data.compensation.overtime_eligible else 'No' if data.compensation.overtime_eligible is False else 'Not specified'}\n\n"

        # Location
        if data.location:
            content += "9. LOCATION / REMOTE WORK\n"
            content += "-" * 60 + "\n"
            content += f"Work from Selected Location: {'Yes' if data.location.work_from_location else 'No' if data.location.work_from_location is False else 'Not specified'}\n"
            content += f"Willing to Relocate: {'Yes' if data.location.willing_to_relocate else 'No' if data.location.willing_to_relocate is False else 'Not specified'}\n\n"

        content += "=" * 60 + "\n"

        # Write to file
        with open(BACKGROUND_INFO_FILE, "w", encoding="utf-8") as f:
            f.write(content)

        return {
            "status": "success",
            "message": "Background information saved successfully",
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error saving background information: {str(e)}"
        )


@questionnaire_router.get("/api/background-questionnaire/status")
async def get_questionnaire_status():
    """Check if the questionnaire has been completed"""
    try:
        completed = os.path.exists(BACKGROUND_INFO_FILE)
        return {"completed": completed}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error checking questionnaire status: {str(e)}"
        )
