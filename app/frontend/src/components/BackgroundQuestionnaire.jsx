import { Box, VStack, HStack, Text, Button, Input, createListCollection, Image, Flex, Spacer } from '@chakra-ui/react';
import { Radio, RadioGroup } from './ui/radio';
import { Field } from './ui/field';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toaster } from './ui/toaster';
import {
    SelectContent,
    SelectItem,
    SelectRoot,
    SelectTrigger,
    SelectValueText,
} from "./ui/select"

export default function BackgroundQuestionnaire() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        eeo: {
            gender: '',
            race_ethnicity: '',
            protected_veteran: null,
            disability: null,
        },
        work_authorization: {
            legally_authorized: null,
            sponsorship_required: null,
            current_visa: '',
        },
        background_check: {
            willing_to_undergo: null,
            felony_conviction: null,
            pending_charges: null,
        },
        export_control: {
            citizen_or_resident: null,
            export_control_restrictions: null,
            us_person: null,
        },
        conflict_of_interest: {
            relatives_at_company: null,
            competitor_work: null,
            financial_conflicts: null,
        },
        data_privacy: {
            data_processing_consent: null,
            policy_agreement: null,
        },
        employment_eligibility: {
            over_18: null,
            can_provide_documentation: null,
        },
        compensation: {
            salary_expectations: '',
            overtime_eligible: null,
        },
        location: {
            work_from_location: null,
            willing_to_relocate: null,
        },
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const genderOptions = createListCollection({
        items: [
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
            { label: "Non-binary", value: "non-binary" },
            { label: "Prefer not to say", value: "prefer-not-to-say" },
            { label: "Other", value: "other" },
        ],
    });

    const raceOptions = createListCollection({
        items: [
            { label: "American Indian or Alaska Native", value: "american-indian" },
            { label: "Asian", value: "asian" },
            { label: "Black or African American", value: "black" },
            { label: "Hispanic or Latino", value: "hispanic" },
            { label: "Native Hawaiian or Pacific Islander", value: "native-hawaiian" },
            { label: "White", value: "white" },
            { label: "Two or More Races", value: "two-or-more" },
            { label: "Prefer not to say", value: "prefer-not-to-say" },
        ],
    });

    const visaOptions = createListCollection({
        items: [
            { label: "None", value: "none" },
            { label: "F-1 (Student)", value: "f1" },
            { label: "H-1B (Specialty Occupation)", value: "h1b" },
            { label: "L-1 (Intracompany Transfer)", value: "l1" },
            { label: "O-1 (Extraordinary Ability)", value: "o1" },
            { label: "TN (NAFTA Professional)", value: "tn" },
            { label: "J-1 (Exchange Visitor)", value: "j1" },
            { label: "OPT (Optional Practical Training)", value: "opt" },
            { label: "CPT (Curricular Practical Training)", value: "cpt" },
            { label: "Green Card", value: "green-card" },
            { label: "Other", value: "other" },
        ],
    });

    const updateField = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value === 'true' ? true : value === 'false' ? false : value
            }
        }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('http://localhost:8000/api/background-questionnaire', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                throw new Error('Failed to save questionnaire');
            }

            toaster.success({
                title: "Success",
                description: "Background information saved successfully!",
                duration: 3000,
            });

            navigate('/');
        } catch (error) {
            console.error('Error saving questionnaire:', error);
            toaster.error({
                title: "Error",
                description: "Failed to save background information. Please try again.",
                duration: 3000,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box minH="100vh" bg="gray.50">
            {/* Header */}
            <Box
                bg="white"
                borderBottom="1px"
                borderColor="gray.200"
                py={3}
                px={6}
                boxShadow="sm"
                position="sticky"
                top="0"
                zIndex={1000}
            >
                <Box maxW="900px" mx="auto">
                    <Flex align="center">
                        <Image src="/autoresume-logo.png" alt="AutoResume Logo" height="50px" />
                        <Text fontSize="2xl" fontWeight="bold">autoResume</Text>
                        <Spacer />
                    </Flex>
                </Box>
            </Box>

            <Box py={8} px={4}>
                <Box maxW="900px" mx="auto">
                    <VStack spacing={8} align="stretch">
                        {/* Header */}
                        <Box textAlign="center">
                            <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                                Background Information Questionnaire
                            </Text>
                            <Text mt={2} color="gray.600">
                                Please provide the following information. This data is stored locally and used for job applications.
                            </Text>
                        </Box>

                        {/* 1. EEO Questions */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xl" fontWeight="semibold" mb={4}>
                                1. Equal Employment Opportunity (EEO)
                            </Text>
                            <Text fontSize="sm" color="gray.600" mb={4}>
                                Optional and anonymous—used only for statistics
                            </Text>
                            <VStack spacing={4} align="stretch">
                                <Field label="Gender">
                                    <SelectRoot
                                        collection={genderOptions}
                                        value={formData.eeo.gender ? [formData.eeo.gender] : []}
                                        onValueChange={(e) => updateField('eeo', 'gender', e.value[0])}
                                    >
                                        <SelectTrigger>
                                            <SelectValueText placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {genderOptions.items.map((item) => (
                                                <SelectItem key={item.value} item={item}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field>
                                <Field label="Race/Ethnicity">
                                    <SelectRoot
                                        collection={raceOptions}
                                        value={formData.eeo.race_ethnicity ? [formData.eeo.race_ethnicity] : []}
                                        onValueChange={(e) => updateField('eeo', 'race_ethnicity', e.value[0])}
                                    >
                                        <SelectTrigger>
                                            <SelectValueText placeholder="Select race/ethnicity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {raceOptions.items.map((item) => (
                                                <SelectItem key={item.value} item={item}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field>
                                <Field label="Are you a protected veteran?">
                                    <RadioGroup
                                        value={formData.eeo.protected_veteran === null ? '' : formData.eeo.protected_veteran.toString()}
                                        onValueChange={(value) => updateField('eeo', 'protected_veteran', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                                <Field label="Do you have a disability?">
                                    <RadioGroup
                                        value={formData.eeo.disability === null ? '' : formData.eeo.disability.toString()}
                                        onValueChange={(value) => updateField('eeo', 'disability', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                            </VStack>
                        </Box>

                        {/* 2. Work Authorization */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xl" fontWeight="semibold" mb={4}>
                                2. Work Authorization / Immigration
                            </Text>
                            <VStack spacing={4} align="stretch">
                                <Field label="Are you legally authorized to work in the United States?">
                                    <RadioGroup
                                        value={formData.work_authorization.legally_authorized === null ? '' : formData.work_authorization.legally_authorized.toString()}
                                        onValueChange={(value) => updateField('work_authorization', 'legally_authorized', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                                <Field label="Will you now or in the future require sponsorship (e.g., H-1B, O-1)?">
                                    <RadioGroup
                                        value={formData.work_authorization.sponsorship_required === null ? '' : formData.work_authorization.sponsorship_required.toString()}
                                        onValueChange={(value) => updateField('work_authorization', 'sponsorship_required', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                                <Field label="Are you currently on a visa? If yes, which one?">
                                    <SelectRoot
                                        collection={visaOptions}
                                        value={formData.work_authorization.current_visa ? [formData.work_authorization.current_visa] : []}
                                        onValueChange={(e) => updateField('work_authorization', 'current_visa', e.value[0])}
                                    >
                                        <SelectTrigger>
                                            <SelectValueText placeholder="Select visa type or None" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {visaOptions.items.map((item) => (
                                                <SelectItem key={item.value} item={item}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field>
                            </VStack>
                        </Box>

                        {/* 3. Background Check */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xl" fontWeight="semibold" mb={4}>
                                3. Background Check Consent
                            </Text>
                            <VStack spacing={4} align="stretch">
                                <Field label="Are you willing to undergo a background check?">
                                    <RadioGroup
                                        value={formData.background_check.willing_to_undergo === null ? '' : formData.background_check.willing_to_undergo.toString()}
                                        onValueChange={(value) => updateField('background_check', 'willing_to_undergo', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                                <Field label="Have you ever been convicted of a felony?">
                                    <RadioGroup
                                        value={formData.background_check.felony_conviction === null ? '' : formData.background_check.felony_conviction.toString()}
                                        onValueChange={(value) => updateField('background_check', 'felony_conviction', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                                <Field label="Are there any pending criminal charges?">
                                    <RadioGroup
                                        value={formData.background_check.pending_charges === null ? '' : formData.background_check.pending_charges.toString()}
                                        onValueChange={(value) => updateField('background_check', 'pending_charges', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                            </VStack>
                        </Box>

                        {/* 4. Export Control */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xl" fontWeight="semibold" mb={4}>
                                4. Export Control / Security Questions
                            </Text>
                            <Text fontSize="sm" color="gray.600" mb={4}>
                                Common for engineering, aerospace, defense, and semiconductor jobs
                            </Text>
                            <VStack spacing={4} align="stretch">
                                <Field label="Are you a citizen or permanent resident of the United States?">
                                    <RadioGroup
                                        value={formData.export_control.citizen_or_resident === null ? '' : formData.export_control.citizen_or_resident.toString()}
                                        onValueChange={(value) => updateField('export_control', 'citizen_or_resident', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                                <Field label="Are you subject to U.S. export control restrictions?">
                                    <RadioGroup
                                        value={formData.export_control.export_control_restrictions === null ? '' : formData.export_control.export_control_restrictions.toString()}
                                        onValueChange={(value) => updateField('export_control', 'export_control_restrictions', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                                <Field label="Are you a 'U.S. Person' under ITAR/EAR?">
                                    <RadioGroup
                                        value={formData.export_control.us_person === null ? '' : formData.export_control.us_person.toString()}
                                        onValueChange={(value) => updateField('export_control', 'us_person', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                            </VStack>
                        </Box>

                        {/* 5. Conflict of Interest */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xl" fontWeight="semibold" mb={4}>
                                5. Conflict of Interest
                            </Text>
                            <VStack spacing={4} align="stretch">
                                <Field label="Do you have any relatives working at the company?">
                                    <RadioGroup
                                        value={formData.conflict_of_interest.relatives_at_company === null ? '' : formData.conflict_of_interest.relatives_at_company.toString()}
                                        onValueChange={(value) => updateField('conflict_of_interest', 'relatives_at_company', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                                <Field label="Are you currently working for or contracted with a competitor?">
                                    <RadioGroup
                                        value={formData.conflict_of_interest.competitor_work === null ? '' : formData.conflict_of_interest.competitor_work.toString()}
                                        onValueChange={(value) => updateField('conflict_of_interest', 'competitor_work', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                                <Field label="Do you hold any financial interests that may conflict?">
                                    <RadioGroup
                                        value={formData.conflict_of_interest.financial_conflicts === null ? '' : formData.conflict_of_interest.financial_conflicts.toString()}
                                        onValueChange={(value) => updateField('conflict_of_interest', 'financial_conflicts', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                            </VStack>
                        </Box>

                        {/* 6. Data Privacy */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xl" fontWeight="semibold" mb={4}>
                                6. Data Privacy Consent
                            </Text>
                            <VStack spacing={4} align="stretch">
                                <Field label="Do you consent to your data being stored and processed for recruiting purposes?">
                                    <RadioGroup
                                        value={formData.data_privacy.data_processing_consent === null ? '' : formData.data_privacy.data_processing_consent.toString()}
                                        onValueChange={(value) => updateField('data_privacy', 'data_processing_consent', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                                <Field label="Do you agree to the data protection policy?">
                                    <RadioGroup
                                        value={formData.data_privacy.policy_agreement === null ? '' : formData.data_privacy.policy_agreement.toString()}
                                        onValueChange={(value) => updateField('data_privacy', 'policy_agreement', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                            </VStack>
                        </Box>

                        {/* 7. Employment Eligibility */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xl" fontWeight="semibold" mb={4}>
                                7. Employment Eligibility / Age
                            </Text>
                            <VStack spacing={4} align="stretch">
                                <Field label="Are you at least 18 years old?">
                                    <RadioGroup
                                        value={formData.employment_eligibility.over_18 === null ? '' : formData.employment_eligibility.over_18.toString()}
                                        onValueChange={(value) => updateField('employment_eligibility', 'over_18', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                                <Field label="Can you provide documentation verifying identity and employment eligibility?">
                                    <RadioGroup
                                        value={formData.employment_eligibility.can_provide_documentation === null ? '' : formData.employment_eligibility.can_provide_documentation.toString()}
                                        onValueChange={(value) => updateField('employment_eligibility', 'can_provide_documentation', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                            </VStack>
                        </Box>

                        {/* 8. Compensation */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xl" fontWeight="semibold" mb={4}>
                                8. Compensation Disclosure
                            </Text>
                            <VStack spacing={4} align="stretch">
                                <Field label="What are your salary expectations?">
                                    <Input
                                        value={formData.compensation.salary_expectations}
                                        onChange={(e) => updateField('compensation', 'salary_expectations', e.target.value)}
                                        placeholder="e.g., $80,000 - $100,000"
                                    />
                                </Field>
                                <Field label="Are you eligible to work overtime?">
                                    <RadioGroup
                                        value={formData.compensation.overtime_eligible === null ? '' : formData.compensation.overtime_eligible.toString()}
                                        onValueChange={(value) => updateField('compensation', 'overtime_eligible', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                            </VStack>
                        </Box>

                        {/* 9. Location */}
                        <Box bg="white" p={6} borderRadius="lg" boxShadow="sm" border="1px solid" borderColor="gray.200">
                            <Text fontSize="xl" fontWeight="semibold" mb={4}>
                                9. Location / Remote Work Compliance
                            </Text>
                            <VStack spacing={4} align="stretch">
                                <Field label="Are you able to legally work from the location you selected?">
                                    <RadioGroup
                                        value={formData.location.work_from_location === null ? '' : formData.location.work_from_location.toString()}
                                        onValueChange={(value) => updateField('location', 'work_from_location', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                                <Field label="Are you willing to relocate?">
                                    <RadioGroup
                                        value={formData.location.willing_to_relocate === null ? '' : formData.location.willing_to_relocate.toString()}
                                        onValueChange={(value) => updateField('location', 'willing_to_relocate', value)}
                                    >
                                        <HStack spacing={4}>
                                            <Radio value="true">Yes</Radio>
                                            <Radio value="false">No</Radio>
                                        </HStack>
                                    </RadioGroup>
                                </Field>
                            </VStack>
                        </Box>

                        {/* Submit Button */}
                        <Box textAlign="center" pb={8}>
                            <Button
                                colorScheme="blue"
                                size="lg"
                                onClick={handleSubmit}
                                loading={isSubmitting}
                                loadingText="Saving..."
                            >
                                Save and Continue
                            </Button>
                        </Box>
                    </VStack>
                </Box>
            </Box>
        </Box>
    );
}
