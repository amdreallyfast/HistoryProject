import styles from "./Modal.module.scss"

export default function Modal(props) {
    const modalState = props.toggle
    const toggleFunc = props.onClickAction

    return (
        <div className={`${styles.modalcontainer} ${modalState ? styles.active : ''}`}>
            <div className={styles.modal}>
                <div className={styles.textblock}>
                    <p><b>History of the World</b></p>
                    <p>This project sees the potential in gathering many perspectives on a variety of events through time. With enough viewpoints, a greater understanding is possible.<br/>- John Cox, creator, Microsoft Hackathon 9/23/2022</p>
                </div>
                <div className={styles.closeicon} onClick={toggleFunc}></div>
            </div>
        </div>
    )
}
