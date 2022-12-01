export default function App() {
  const { register, handleSubmit, errors } = useForm();

  const onSubmit = data => {
    console.log(data);
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input type="text" placeholder="IGO Request ID" ref={register} />
      <input type="text" placeholder="IGO Project ID" ref={register} />
      <input type="text" placeholder="# Samples" ref={register} />
      <input type="text" placeholder="Project Manager " ref={register} />
      <input type="text" placeholder="Investigator Name" ref={register} />
      <input type="text" placeholder="Investigator Email" ref={register} />
      <input type="text" placeholder="PI Email" ref={register} />
      <input type="text" placeholder="Data Analyst Name" ref={register} />
      <input type="text" placeholder="Data Analyst Email" ref={register} />
      <input type="text" placeholder="Gene Panel" ref={register} />
      <input type="text" placeholder="Lab Head Name" ref={register} />
      <input type="text" placeholder="QC Access Emails" ref={register} />
      <input type="text" placeholder="Data Access Emails" ref={register} />
      <input type="text" placeholder="BIC Analysis" ref={register} />
      <input type="text" placeholder="CMO Request?" ref={register} />
      <input type="text" placeholder="Other Contact Emails" ref={register} />
    </form>
  );
}
