import { useState } from "react";
import "./form.css";

const defaultFormData = {
  igoRequestId: "",
  igoProjectId: "",
  hasSampleSamplesConnection: "",
  projectManagerName: "",
  investigatorName: "",
  investigatorEmail: "",
  piEmail: "",
  dataAnalystName: "",
  dataAnalystEmail: "",
  genePanel: "",
  labHeadName: "",
  labHeadEmail: "",
  qcAccessEmails: "",
  dataAccessEmails: "",
  bicAnalysis: "",
  isCmoRequest: "",
  otherContactEmails: ""
};

export default function TestForm() {
  const [formData, setFormData] = useState(defaultFormData);
  const {
    igoRequestId,
    igoProjectId,
    hasSampleSamplesConnection,
    projectManagerName,
    investigatorName,
    investigatorEmail,
    piEmail,
    dataAnalystName,
    dataAnalystEmail,
    genePanel,
    labHeadName,
    labHeadEmail,
    qcAccessEmails,
    dataAccessEmails,
    bicAnalysis,
    isCmoRequest,
    otherContactEmails
  } = formData;

  // const handleChange = event => {
  //     const value = event.target.value;
  //     this.setState({
  //       input: value
  //     })
  // };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prevState => ({
      ...prevState,
      [e.target.id]: e.target.value
    }));
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formData);

    setFormData(defaultFormData);
  };

  return (
    <>
      <form onSubmit={onSubmit}>
        <br />
        <label htmlFor="igoRequestId">IGO Request ID</label>
        <br />
        <input
          type="text"
          id="igoRequestId"
          defaultValue={igoProjectId}
          onChange={onChange}
        />
        <br />
        <label htmlFor="igoProjectId">IGO Project ID</label>
        <br />
        <input
          type="text"
          id="igoProjectId"
          defaultValue={hasSampleSamplesConnection}
          onChange={onChange}
        />
        <br />
        <label htmlFor="hasSampleSamplesConnection">Sample Count</label>
        <br />
        <input
          type="text"
          id="hasSampleSamplesConnection"
          defaultValue={projectManagerName}
          onChange={onChange}
        />
        <br />
        <label htmlFor="projectManagerName">Project Manager Name</label>
        <br />
        <input
          type="text"
          id="projectManagerName"
          defaultValue={investigatorName}
          onChange={onChange}
        />
        <br />
        <label htmlFor="investigatorName"> Investigator Name</label>
        <br />
        <input
          type="text"
          id="investigatorName"
          defaultValue={investigatorEmail}
          onChange={onChange}
        />
        <br />
        <label htmlFor="investigatorEmail">Investigator Email</label>
        <br />
        <input
          type="text"
          id="investigatorEmail"
          defaultValue={piEmail}
          onChange={onChange}
        />
        <br />
        <label htmlFor="piEmail">PI Email</label>
        <br />
        <input
          type="text"
          id="piEmail"
          defaultValue={dataAnalystName}
          onChange={onChange}
        />
        <br />
        <label htmlFor="dataAnalystName">Data Analyst Name</label>
        <br />
        <input
          type="text"
          id="dataAnalystName"
          defaultValue={dataAnalystEmail}
          onChange={onChange}
        />
        <br />
        <label htmlFor="dataAnalystEmail">Data Analyst Email</label>
        <br />
        <input
          type="text"
          id="dataAnalystEmail"
          defaultValue={genePanel}
          onChange={onChange}
        />
        <br />
        <label htmlFor="genePanel">Gene Panel</label>
        <br />
        <input
          type="text"
          id="genePanel"
          defaultValue={labHeadName}
          onChange={onChange}
        />
        <br />
        <label htmlFor="labHeadName"> Lab Head Name</label>
        <br />
        <input
          type="text"
          id="labHeadName"
          defaultValue={labHeadEmail}
          onChange={onChange}
        />
        <br />
        <label htmlFor="labHeadEmail"> Lab Head Email</label>
        <br />
        <input
          type="text"
          id="labHeadEmail"
          defaultValue={qcAccessEmails}
          onChange={onChange}
        />
        <br />
        <label htmlFor="qcAccessEmails"> QC Access Emails</label>
        <br />
        <input
          type="text"
          id="qcAccessEmails"
          defaultValue={dataAccessEmails}
          onChange={onChange}
        />
        <br />
        <label htmlFor="dataAccessEmails"> Data Access Emails</label>
        <br />
        <input
          type="text"
          id="dataAccessEmails"
          defaultValue={bicAnalysis}
          onChange={onChange}
        />
        <br />
        <label htmlFor="bicAnalysis">BIC Analysis</label>
        <br />
        <input
          type="text"
          id="bicAnalysis"
          defaultValue={isCmoRequest}
          onChange={onChange}
        />
        <br />
        <label htmlFor="isCmoRequest"> CMO Request</label>
        <br />
        <input
          type="text"
          id="isCmoRequest"
          defaultValue={otherContactEmails}
          onChange={onChange}
        />
        <br />
        <label htmlFor="otherContactEmails"> Other Contact Emails</label>
        <br />
        <input
          type="text"
          id="otherContactEmails"
          defaultValue={otherContactEmails}
          onChange={onChange}
        />
        <br />
        <button type="submit">Submit</button>
        <br />
        <br />
      </form>
    </>
  );
}
